var e={answerHtml:`<h2>简答</h2>
<ul>
<li>默认插槽和具名插槽（<code>&lt;slot name=&quot;footer&quot;&gt;</code>、<code>&lt;template #footer&gt;</code>）决定&quot;内容放在哪&quot;，插槽内容在父组件的作用域中编译，只能访问父组件的数据。</li>
<li>作用域插槽：子组件通过 <code>&lt;slot :item=&quot;item&quot;&gt;</code> 把数据传出去，父组件用 <code>#default=&quot;{ item }&quot;</code> 接收并决定渲染方式，常用于列表、表格的行模板。</li>
<li><code>provide(key, value)</code> / <code>inject(key, default)</code> 跨层传递依赖，中间组件不需要知道。</li>
<li>要让注入的值保持响应，provide 一个 ref 或 reactive；修改数据的方法也一起 provide，让状态只在提供者里修改。</li>
<li>用 <code>Symbol</code> 作为 key 避免命名冲突，TypeScript 中用 <code>InjectionKey&lt;T&gt;</code> 获得类型。</li>
</ul>
<h2>作用域插槽：列表组件</h2>
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
<p><code>DataList</code> 负责加载、空状态和列表结构，每一行长什么样由使用方决定。<code>&lt;slot&gt;</code> 标签内的内容是没有传入插槽时的默认内容。</p>
<h2>provide/inject：表单上下文</h2>
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
<p><code>readonly</code> 让后代只能读，修改必须通过 <code>setError</code>，状态变化都发生在提供者中，便于排查。</p>
<h2>怎么选</h2>
<table><thead><tr><th>需求</th><th>方案</th></tr></thead><tbody><tr><td>让使用方决定某块区域显示什么</td><td>插槽</td></tr><tr><td>子组件有数据，但渲染方式由使用方定</td><td>作用域插槽</td></tr><tr><td>深层组件需要祖先的配置或服务</td><td>provide/inject</td></tr><tr><td>应用级共享状态</td><td>Pinia</td></tr></tbody></table>
<h2>常见追问</h2>
<ul>
<li>怎么判断父组件有没有传某个插槽？用 <code>useSlots()</code> 或模板中的 <code>$slots.footer</code>。</li>
<li>inject 找不到 key 会怎样？返回第二个参数指定的默认值，没有默认值时开发环境会警告。</li>
</ul>`};export{e as default};