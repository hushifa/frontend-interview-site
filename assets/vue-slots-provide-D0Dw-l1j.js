var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>插槽就是子组件留出的空位，父组件往里填内容。比如卡片组件留一个 <code>footer</code> 的位置，父组件用 <code>&lt;template #footer&gt;</code> 往里放按钮。这些内容是在父组件里写的，所以只能用父组件的数据。</p>
<p>作用域插槽是反过来让子组件交数据。子组件写 <code>&lt;slot :item=&quot;item&quot;&gt;</code> 把每一行的数据传出去，父组件用 <code>#default=&quot;{ item }&quot;</code> 接住，自己决定这一行长什么样，列表和表格的行模板常这么做。</p>
<p>provide/inject 解决的是跨层传递。祖先组件 <code>provide(key, value)</code>，任意深度的后代 <code>inject(key)</code> 就能拿到，中间的组件完全不用管。</p>
<p>用 provide 时有两点要注意。想让注入的值是响应式的，就 provide 一个 ref 或 reactive，并把修改数据的方法一起 provide 出去，让状态只在提供者里改。key 用 <code>Symbol</code> 防止重名，TypeScript 里用 <code>InjectionKey&lt;T&gt;</code> 带上类型。</p>
</blockquote>
<h2>作用域插槽：列表组件</h2>
<p>下面的 <code>DataList</code> 负责加载中、空状态和列表结构，但每一行长什么样交给使用方：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- DataList.vue --&gt;
&lt;script setup&gt;
defineProps({ items: Array, loading: Boolean });
&lt;/script&gt;

&lt;template&gt;
  &lt;p v-if=&quot;loading&quot;&gt;加载中…&lt;/p&gt;
  &lt;ul v-else-if=&quot;items.length&quot;&gt;
    &lt;li v-for=&quot;item in items&quot; :key=&quot;item.id&quot;&gt;
      &lt;slot :item=&quot;item&quot;&gt;{{ item.title }}&lt;/slot&gt;
    &lt;/li&gt;
  &lt;/ul&gt;
  &lt;slot v-else name=&quot;empty&quot;&gt;&lt;p&gt;暂无数据&lt;/p&gt;&lt;/slot&gt;
&lt;/template&gt;
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;DataList :items=&quot;users&quot; :loading=&quot;loading&quot;&gt;
  &lt;template #default=&quot;{ item }&quot;&gt;
    &lt;strong&gt;{{ item.name }}&lt;/strong&gt; &lt;small&gt;{{ item.email }}&lt;/small&gt;
  &lt;/template&gt;
  &lt;template #empty&gt;还没有用户，&lt;a href=&quot;/invite&quot;&gt;邀请一位&lt;/a&gt;&lt;/template&gt;
&lt;/DataList&gt;
</code></pre></div>
<p>插槽内容写在父组件里，按理只能访问父组件的数据，那 <code>item</code> 是哪来的？是子组件通过 <code>&lt;slot :item=&quot;item&quot;&gt;</code> 递出来的。父组件在 <code>#default=&quot;{ item }&quot;</code> 里接住它，就能用了。</p>
<p><code>&lt;slot&gt;</code> 标签里面的内容是默认内容。父组件没传这个插槽时，就显示 <code>{{ item.title }}</code> 和“暂无数据”。</p>
<h2>provide/inject：表单上下文</h2>
<p>表单里的字段可能嵌在很多层组件里面，每一层都传 <code>disabled</code> 和 <code>errors</code> 会很麻烦。用 provide/inject 可以让字段直接拿到表单的状态：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// form-context.js</span>
<span class="hljs-keyword">import</span> { inject, provide, reactive, readonly } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vue&#x27;</span>;

<span class="hljs-keyword">const</span> <span class="hljs-title class_">FormKey</span> = <span class="hljs-title class_">Symbol</span>(<span class="hljs-string">&#x27;form&#x27;</span>);

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">provideForm</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> state = <span class="hljs-title function_">reactive</span>({ <span class="hljs-attr">disabled</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">errors</span>: {} });
  <span class="hljs-keyword">const</span> <span class="hljs-title function_">setError</span> = (<span class="hljs-params">field, msg</span>) =&gt; { state.<span class="hljs-property">errors</span>[field] = msg; };
  <span class="hljs-title function_">provide</span>(<span class="hljs-title class_">FormKey</span>, { <span class="hljs-attr">state</span>: <span class="hljs-title function_">readonly</span>(state), setError });
  <span class="hljs-keyword">return</span> state;
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">useForm</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">inject</span>(<span class="hljs-title class_">FormKey</span>, <span class="hljs-literal">null</span>);
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- FormField.vue，可以放在 Form 下任意深度 --&gt;
&lt;script setup&gt;
import { useForm } from &#x27;./form-context&#x27;;
const props = defineProps({ name: String });
const form = useForm();
&lt;/script&gt;

&lt;template&gt;
  &lt;input :name=&quot;props.name&quot; :disabled=&quot;form?.state.disabled&quot; /&gt;
  &lt;p v-if=&quot;form?.state.errors[props.name]&quot;&gt;{{ form.state.errors[props.name] }}&lt;/p&gt;
&lt;/template&gt;
</code></pre></div>
<p>为什么 provide 出去的是 <code>readonly(state)</code>？因为如果每个后代都能直接改 <code>state</code>，出了问题就不知道是谁改的。用 <code>readonly</code> 包一层，后代只能读，想改就得调 <code>setError</code>，所有修改都发生在提供者这里，排查起来很方便。</p>
<h2>该用哪一个</h2>
<table><thead><tr><th>需求</th><th>方案</th></tr></thead><tbody><tr><td>让使用方决定某块区域显示什么</td><td>插槽</td></tr><tr><td>子组件有数据，但渲染方式由使用方定</td><td>作用域插槽</td></tr><tr><td>深层组件需要祖先的配置或服务</td><td>provide/inject</td></tr><tr><td>应用级共享状态</td><td>Pinia</td></tr></tbody></table>
<h2>常见追问</h2>
<p><strong>怎么判断父组件有没有传某个插槽？</strong></p>
<blockquote>
<p>在 <code>&lt;script setup&gt;</code> 里用 <code>useSlots()</code>，模板里可以直接判断 <code>$slots.footer</code>。</p>
</blockquote>
<p><strong>inject 找不到对应的 key 会怎样？</strong></p>
<blockquote>
<p>返回第二个参数给的默认值。没有给默认值的话，开发环境会给出警告。</p>
</blockquote>`};export{e as default};