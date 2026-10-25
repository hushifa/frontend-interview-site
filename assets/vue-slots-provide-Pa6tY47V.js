var e={answerHtml:`<p>一个列表组件负责布局，但每一行怎样显示由调用方决定，这适合插槽。一个主题值需要经过多层布局组件传给深处按钮，却不想让每一层都转发 theme，这适合 provide/inject。</p>
<p>两者都能让组件协作，但一个主要表达内容组合，另一个主要表达依赖来源。把它们都当成“省传参工具”，容易忽略作用域和所有权。</p>
<h3>子组件提供位置与插槽参数</h3>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- ItemList.vue --&gt;
&lt;script setup&gt;
const props = defineProps({
  items: { type: Array, required: true },
  label: { type: String, default: &#x27;列表&#x27; },
});
&lt;/script&gt;

&lt;template&gt;
  &lt;ul :aria-label=&quot;props.label&quot;&gt;
    &lt;li v-for=&quot;(item, index) in props.items&quot; :key=&quot;item.id&quot;&gt;
      &lt;slot name=&quot;item&quot; :item=&quot;item&quot; :index=&quot;index&quot;&gt;
        &lt;span&gt;{{ item.title }}&lt;/span&gt;
      &lt;/slot&gt;
    &lt;/li&gt;
  &lt;/ul&gt;
&lt;/template&gt;
</code></pre></div>
<p>item 是具名插槽，子组件通过插槽参数公开当前记录和索引。调用方没有提供这个插槽时，使用 span 里的默认内容。</p>
<p>普通插槽内容使用定义它的父级作用域，不能无条件访问子组件的内部变量。作用域插槽提供的是明确参数，不是把子组件的全部 setup 状态都开放出去。</p>
<h3>跨层主题使用共享注入键</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// themeKey.js</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> themeKey = <span class="hljs-title class_">Symbol</span>(<span class="hljs-string">&#x27;阅读主题&#x27;</span>);
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- ThemedButton.vue --&gt;
&lt;script setup&gt;
import { inject } from &#x27;vue&#x27;;
import { themeKey } from &#x27;./themeKey.js&#x27;;

const context = inject(themeKey, null);
if (!context) throw new Error(&#x27;主题按钮需要上层主题提供者&#x27;);
const { theme, toggle } = context;
&lt;/script&gt;

&lt;template&gt;
  &lt;button type=&quot;button&quot; :data-theme=&quot;theme&quot; @click=&quot;toggle&quot;&gt;切换主题：{{ theme }}&lt;/button&gt;
&lt;/template&gt;
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- ThemePanel.vue --&gt;
&lt;script setup&gt;
import ThemedButton from &#x27;./ThemedButton.vue&#x27;;
&lt;/script&gt;

&lt;template&gt;
  &lt;section&gt;
    &lt;h3&gt;阅读外观&lt;/h3&gt;
    &lt;ThemedButton /&gt;
  &lt;/section&gt;
&lt;/template&gt;
</code></pre></div>
<p>ThemePanel 没有接收或转发 theme，深处按钮通过共享的 Symbol 键向上查找。提供者与消费者必须使用同一个键对象；分别写两次 Symbol(&#x27;阅读主题&#x27;) 会创建两个不同值，即使描述字符串相同也不能匹配。</p>
<h3>父级同时组织内容与修改权限</h3>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- Parent.vue --&gt;
&lt;script setup&gt;
import { provide, readonly, ref } from &#x27;vue&#x27;;
import ItemList from &#x27;./ItemList.vue&#x27;;
import ThemePanel from &#x27;./ThemePanel.vue&#x27;;
import { themeKey } from &#x27;./themeKey.js&#x27;;

const prefix = ref(&#x27;学习&#x27;);
const items = [
  { id: &#x27;html&#x27;, title: &#x27;HTML&#x27; },
  { id: &#x27;css&#x27;, title: &#x27;CSS&#x27; },
];
const theme = ref(&#x27;light&#x27;);
function toggle() {
  theme.value = theme.value === &#x27;light&#x27; ? &#x27;dark&#x27; : &#x27;light&#x27;;
}
provide(themeKey, { theme: readonly(theme), toggle });
&lt;/script&gt;

&lt;template&gt;
  &lt;main&gt;
    &lt;button type=&quot;button&quot; @click=&quot;prefix = &#x27;复习&#x27;&quot;&gt;修改前缀&lt;/button&gt;
    &lt;ItemList :items=&quot;items&quot; label=&quot;定制列表&quot;&gt;
      &lt;template #item=&quot;{ item, index }&quot;&gt;
        &lt;strong&gt;{{ prefix }} {{ index + 1 }} {{ item.title }}&lt;/strong&gt;
      &lt;/template&gt;
    &lt;/ItemList&gt;
    &lt;ItemList :items=&quot;items&quot; label=&quot;默认列表&quot; /&gt;
    &lt;p&gt;父级主题：{{ theme }}&lt;/p&gt;
    &lt;ThemePanel /&gt;
  &lt;/main&gt;
&lt;/template&gt;
</code></pre></div>
<p>插槽中的 prefix 来自父级，item 与 index 来自子级传出的插槽参数，两个来源明确地组合在一起。修改 prefix 会更新定制内容，但不会把子组件的默认插槽文本变成同一套自定义内容。</p>
<p>主题则由父级创建，向下提供只读视图和明确的 toggle 方法。深处按钮可以请求切换，但不需要自己决定怎样直接修改父级的任意状态。</p>
<h3>注入一个值，不会自动让它变成响应式</h3>
<p>provide(key, count.value) 传出的是当时的普通值，之后 count 变化不会凭空把那个数字变成响应式连接。传递 ref、reactive 或 computed 等合适来源，消费者才可以沿相应关系持续读取变化。</p>
<p>inject 得到 ref 时，在 JavaScript 中仍按 ref 的接口使用；放到模板中则遵循模板解包规则。示例解构出来的 theme 本身就是 ref，所以没有像解构普通 reactive 原始属性那样丢失连接。</p>
<p>readonly 主要限制消费者通过该视图修改，修改逻辑仍放在提供者。它不是权限系统，也不会取消应用中其他可变引用的存在。</p>
<h3>最近提供者与默认值应体现契约</h3>
<p>同一个注入键有多个祖先提供者时，读取最近的那一个。这适合局部覆盖主题或配置，但也会让来源更隐蔽，组件文档应说明它依赖哪些上下文。</p>
<p>缺失时可以提供合理默认值，也可以像示例一样直接报告使用错误。某个能力如果没有提供者就无法正常工作，不应返回一个悄悄什么都不做的空函数，让失败延迟到更难定位的位置。</p>
<p>应用级 provide 可以为整棵应用提供依赖，但不等于应该把所有状态都放到全局。SSR 还需要按请求隔离用户数据，避免模块级共享对象串用不同请求。</p>
<h3>插槽参数也不是任意修改权</h3>
<p>通过作用域插槽拿到一个对象，可能仍然是原数据的引用。调用方直接修改它，会影响真实所有者；是否允许这种写法，应由组件契约决定，不能因为“子组件公开了 item”就默认允许随意改动。</p>
<p>复杂组件可以额外公开明确操作函数，例如选中或删除请求，让数据流仍可追踪。动态插槽名、条件插槽和回退内容也应按实际渲染验证，而不是只检查有没有传一个同名模板。</p>
<p>内容高度、CSS 作用范围与逻辑作用域同样不同。插槽内容在哪里定义，决定它能访问哪些变量；最终 DOM 在哪里，仍会影响布局与样式。Teleport 等改变物理位置时，更需要分别看这些关系。</p>
<p>组合得当时，插槽让组件保留布局与行为的可复用性，provide/inject 让稳定依赖跨层可达。两者都应有小而清楚的公开接口，避免把组件变成只有放在某一棵巨大页面树里才碰巧可用的隐式组合。</p>
<p>补充参考：<a href="https://vuejs.org/guide/components/slots.html">Vue · Slots</a>。</p>`};export{e as default};