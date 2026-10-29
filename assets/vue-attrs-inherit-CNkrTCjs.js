var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>封装一个 <code>&lt;MyButton&gt;</code>，使用的人写了 <code>&lt;MyButton class=&quot;large&quot; @click=&quot;onClick&quot; /&gt;</code>，可组件既没有声明 <code>class</code> 这个 prop，也没有声明 <code>click</code> 事件。最后渲染出来的 <code>&lt;button&gt;</code> 上却有 <code>class=&quot;large&quot;</code>，点击也能触发 <code>onClick</code>。这些没被声明的属性和监听器叫透传属性。</p>
<p>组件只有一个根元素时，Vue 会把透传属性自动加到根元素上。<code>class</code> 和 <code>style</code> 会和根元素自己写的值合并，监听器如果根元素上也绑了同一个事件，两个都会触发。声明过的 props 和 emits 已经被组件“消费”掉，不在透传范围里。</p>
<p>自动加在根元素上不一定合适。比如按钮外面包了一层 <code>div</code> 做样式，属性应该落到里面的 <code>button</code> 上。这时设置 <code>inheritAttrs: false</code> 关掉自动透传，再在 <code>button</code> 上写 <code>v-bind=&quot;$attrs&quot;</code>。Vue 3.3 起可以在 <code>&lt;script setup&gt;</code> 里用 <code>defineOptions</code> 设置。</p>
<p>要注意两点。多根节点组件不会自动透传，没有显式绑定 <code>$attrs</code> 时运行时会警告。另外在 JavaScript 里用 <code>useAttrs()</code> 拿到的对象总是最新的，但不是响应式的，不能用 <code>watch</code> 监听它。</p>
</blockquote>
<h2>透传属性会落到哪里</h2>
<p>假设 <code>&lt;MyButton&gt;</code> 的模板只有一个带 <code>class=&quot;btn&quot;</code> 的按钮，父组件这样用它：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- MyButton.vue --&gt;
&lt;template&gt;
  &lt;button class=&quot;btn&quot;&gt;点击&lt;/button&gt;
&lt;/template&gt;

&lt;!-- 父组件 --&gt;
&lt;MyButton class=&quot;large&quot; @click=&quot;onClick&quot; /&gt;
</code></pre></div>
<p>渲染出来的 DOM 是 <code>&lt;button class=&quot;btn large&quot;&gt;点击&lt;/button&gt;</code>。为什么 <code>class</code> 不是被覆盖，而是变成两个？因为 <code>class</code> 和 <code>style</code> 会和根元素已有的值合并，其他属性才是直接加上去。<code>@click</code> 也透传到了原生 <code>button</code> 上，点击时会调用父组件的 <code>onClick</code>；如果 <code>button</code> 自己也写了 <code>@click</code>，两个监听器都会执行。</p>
<p>什么属性不会透传？文档的说法是，声明成 props 的属性、声明在 emits 里的事件监听器，都已经被组件消费了，不会再往下传。所以想让组件自己处理 <code>click</code>，就在 <code>emits</code> 里声明它；想让它原样落到元素上，就不声明。props 应该怎样声明，见<a href="/questions/vue-props/">《为什么 Vue 提倡 props 单向数据流？》</a>。</p>
<h2>组件嵌套时属性怎么传</h2>
<p>如果 <code>&lt;MyButton&gt;</code> 的根节点不是原生元素，而是另一个组件 <code>&lt;BaseButton&gt;</code>，透传属性会继续交给 <code>&lt;BaseButton&gt;</code>。传下去的是 <code>&lt;MyButton&gt;</code> 没消费掉的那部分，<code>&lt;BaseButton&gt;</code> 如果声明了其中某个 prop，就会把它当 prop 收下。</p>
<h2>为什么要关掉自动透传</h2>
<p>为了样式，按钮外面常常要套一层 <code>div</code>。这时属性自动落在 <code>div</code> 上就不对了，<code>disabled</code>、<code>aria-label</code> 应该在 <code>button</code> 上。下面要看 <code>$attrs</code> 被绑到了哪个元素：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
defineOptions({
  inheritAttrs: false,
});
&lt;/script&gt;

&lt;template&gt;
  &lt;div class=&quot;btn-wrapper&quot;&gt;
    &lt;button class=&quot;btn&quot; v-bind=&quot;$attrs&quot;&gt;点击&lt;/button&gt;
  &lt;/div&gt;
&lt;/template&gt;
</code></pre></div>
<p><code>inheritAttrs: false</code> 让 Vue 不再往根元素上加，<code>$attrs</code> 里装着所有透传属性，包括 <code>class</code>、<code>style</code>、<code>id</code> 和 <code>onClick</code> 这样的监听器。<code>v-bind</code> 不带参数时会把一个对象的所有属性都绑到元素上，所以它们全部落到了 <code>button</code> 上。<code>defineOptions</code> 是 Vue 3.3 加入的；更早的版本要另写一个普通 <code>&lt;script&gt;</code> 块，在里面 <code>export default { inheritAttrs: false }</code>。</p>
<h2>$attrs 里的属性名长什么样</h2>
<p>和 props 不同，透传属性在 JavaScript 里保留原来的写法，不会转成驼峰。所以 <code>foo-bar</code> 要用 <code>$attrs[&#x27;foo-bar&#x27;]</code> 读。<code>@click</code> 这样的监听器在对象里是一个函数，名字是 <code>$attrs.onClick</code>。</p>
<h2>多根节点组件为什么会警告</h2>
<p>单根组件的透传目标很明确，多根组件就不知道该放在哪个元素上。所以 Vue 不会自动透传，如果也没有显式绑定 <code>$attrs</code>，运行时会发出警告：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;template&gt;
  &lt;header&gt;...&lt;/header&gt;
  &lt;main v-bind=&quot;$attrs&quot;&gt;...&lt;/main&gt;
  &lt;footer&gt;...&lt;/footer&gt;
&lt;/template&gt;
</code></pre></div>
<p>在其中一个根节点上写 <code>v-bind=&quot;$attrs&quot;</code>，告诉 Vue 透传属性放在这里，警告就没有了。</p>
<h2>在 JavaScript 里读透传属性</h2>
<p><code>&lt;script setup&gt;</code> 里用 <code>useAttrs()</code>，不用 <code>&lt;script setup&gt;</code> 时用 <code>setup(props, ctx)</code> 的 <code>ctx.attrs</code>，选项式 API 里是 <code>this.$attrs</code>：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
import { useAttrs } from &#x27;vue&#x27;;

const attrs = useAttrs();
&lt;/script&gt;
</code></pre></div>
<p>这个对象总是反映最新的透传属性，但出于性能考虑，它不是响应式的，不能用 <code>watch</code> 监听它的变化。文档给了两个替代办法：需要响应式就把它声明成 prop；或者用 <code>onUpdated()</code>，在每次更新后拿最新的 <code>attrs</code> 做副作用。</p>
<h2>常见追问</h2>
<p><strong>Vue 2 的 $listeners 去哪了？</strong></p>
<blockquote>
<p>Vue 3 把它合进了 <code>$attrs</code>。监听器在 <code>$attrs</code> 里以 <code>onXxx</code> 的形式出现，比如 <code>onClick</code>，所以 <code>v-bind=&quot;$attrs&quot;</code> 会把属性和监听器一起传下去。</p>
</blockquote>
<p><strong>inheritAttrs: false 会影响 class 和 style 吗？</strong></p>
<blockquote>
<p>会。在 Vue 3 里，<code>class</code> 和 <code>style</code> 也属于 <code>$attrs</code>，关掉自动透传后它们不会再加到根元素上，要靠 <code>v-bind=&quot;$attrs&quot;</code> 自己绑定。</p>
</blockquote>
<p><strong>为什么监听器被触发了两次？</strong></p>
<blockquote>
<p>常见原因是组件没在 <code>emits</code> 里声明这个事件，它就成了透传监听器，被加到了根元素上；组件内部又在点击时 <code>emit</code> 了一次同名事件，父组件的处理函数就执行了两次。在 <code>emits</code> 里声明它，透传就不会发生了。</p>
</blockquote>`};export{e as default};