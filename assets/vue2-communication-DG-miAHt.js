var e={answerHtml:`<blockquote>
<p>Vue 2 已于 2023-12-31 停止维护，本题 Vue 2 部分以 2.7 为准。props 单向数据流、插槽与 provide/inject 的取舍分别见<a href="/questions/vue-props/">《为什么 Vue 提倡 props 单向数据流？》</a>和<a href="/questions/vue-slots-provide/">《插槽、作用域插槽和 provide/inject 各解决什么问题？》</a>。</p>
</blockquote>
<h2>简答</h2>
<ul>
<li>父子之间首选 props 向下、<code>$emit</code> 向上；需要“双向”时用 <code>v-model</code> 或 <code>.sync</code> 语法糖，本质仍是 prop + 事件。</li>
<li>透传用 <code>$attrs</code> 和 <code>$listeners</code>；跨多层用 <code>provide/inject</code>；全局共享状态用 Vuex；<code>$parent</code>、<code>$refs</code> 直接访问实例，耦合最强。</li>
<li>Vue 3 中 <code>$listeners</code> 被移除，监听器以 <code>onXxx</code> 形式并入 <code>$attrs</code>；<code>$attrs</code> 也开始包含 <code>class</code> 和 <code>style</code>。</li>
<li>Vue 3 移除了 <code>.sync</code> 和 <code>model</code> 选项，改为 <code>v-model:title</code>；组件 <code>v-model</code> 默认的 prop/事件从 <code>value</code>/<code>input</code> 变为 <code>modelValue</code>/<code>update:modelValue</code>。</li>
<li>Vue 3 移除了实例上的 <code>$on</code>、<code>$off</code>、<code>$once</code>，基于 <code>new Vue()</code> 的 EventBus 不再可用，官方建议改用 mitt、tiny-emitter 等库；官方状态管理推荐也从 Vuex 变为 Pinia。</li>
</ul>
<h2>Vue 2 的通信方式</h2>
<table><thead><tr><th>方式</th><th>方向</th><th>说明</th></tr></thead><tbody><tr><td>props / <code>$emit</code></td><td>父 → 子 / 子 → 父</td><td>最常用，数据流清晰</td></tr><tr><td><code>v-model</code> / <code>.sync</code></td><td>双向语法糖</td><td><code>:title.sync=&quot;t&quot;</code> 等价于 <code>:title=&quot;t&quot; @update:title=&quot;t = $event&quot;</code></td></tr><tr><td><code>$attrs</code> / <code>$listeners</code></td><td>透传</td><td>包装组件把未声明的属性和监听器转交给内部元素</td></tr><tr><td><code>$parent</code> / <code>$children</code> / <code>$refs</code></td><td>直接访问实例</td><td>便捷但耦合重，适合调用子组件方法</td></tr><tr><td>provide / inject</td><td>祖先 → 后代</td><td>Vue 2 中注入的值默认不是响应式，除非提供的是响应式对象</td></tr><tr><td>EventBus</td><td>任意组件</td><td><code>const bus = new Vue()</code>，用 <code>$on</code>/<code>$emit</code>/<code>$off</code></td></tr><tr><td>Vuex</td><td>全局</td><td>集中管理共享状态</td></tr></tbody></table>
<h2>Vue 3 的变化</h2>
<h3>$listeners 并入 $attrs</h3>
<p>Vue 3 的虚拟 DOM 中，事件监听器就是带 <code>on</code> 前缀的属性，因此归入 <code>$attrs</code>，<code>$listeners</code> 被移除。</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- Vue 2 --&gt;
&lt;input v-bind=&quot;$attrs&quot; v-on=&quot;$listeners&quot; /&gt;

&lt;!-- Vue 3 --&gt;
&lt;input v-bind=&quot;$attrs&quot; /&gt;
</code></pre></div>
<p>两个版本都可以配合 <code>inheritAttrs: false</code> 控制透传位置。注意 Vue 3 的 <code>$attrs</code> 包含 <code>class</code> 和 <code>style</code>，关闭 <code>inheritAttrs</code> 后它们也不会自动落到根元素上。</p>
<h3>.sync 改为 v-model 参数</h3>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- Vue 2 --&gt;
&lt;ChildComponent :title.sync=&quot;pageTitle&quot; /&gt;

&lt;!-- Vue 3 --&gt;
&lt;ChildComponent v-model:title=&quot;pageTitle&quot; /&gt;
</code></pre></div>
<p>子组件仍然 <code>emit(&#x27;update:title&#x27;, value)</code>。Vue 3 允许同一组件绑定多个 <code>v-model</code>，组件的 <code>model</code> 选项也被移除。</p>
<h3>$on / $off / $once 移除</h3>
<p>组件实例不再实现事件发射器接口，EventBus 写法需要替换：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// Vue 3：用 mitt 替代 new Vue() 作为事件总线</span>
<span class="hljs-keyword">import</span> mitt <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;mitt&#x27;</span>;
<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> bus = <span class="hljs-title function_">mitt</span>();

bus.<span class="hljs-title function_">on</span>(<span class="hljs-string">&#x27;saved&#x27;</span>, handler);
bus.<span class="hljs-title function_">emit</span>(<span class="hljs-string">&#x27;saved&#x27;</span>, payload);
bus.<span class="hljs-title function_">off</span>(<span class="hljs-string">&#x27;saved&#x27;</span>, handler);
</code></pre></div>
<p>迁移指南同时提醒，大多数情况下不建议用全局事件总线，优先考虑 props/事件、provide/inject 或全局状态管理。<code>$emit</code> 本身仍保留，用于触发父组件监听的事件。</p>
<h3>其他</h3>
<ul>
<li><code>$children</code> 被移除，改用模板 ref 访问子组件。</li>
<li>Vuex 4 仍支持 Vue 3，但官方文档说明 Vuex 已进入维护模式，新项目推荐 Pinia。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>Vue 3 中子组件的 <code>$emit</code> 事件需要声明吗？推荐用 <code>emits</code> 选项或 <code>defineEmits</code> 声明；未声明的监听器会留在 <code>$attrs</code> 中，默认透传到子组件根元素。</li>
<li>迁移时 <code>.sync</code> 和 <code>$listeners</code> 能临时保留吗？<code>@vue/compat</code> 迁移构建提供 <code>COMPONENT_V_MODEL</code>、<code>INSTANCE_LISTENERS</code>、<code>INSTANCE_EVENT_EMITTER</code> 等兼容开关，可以逐步替换。</li>
</ul>`};export{e as default};