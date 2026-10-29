var e={answerHtml:`<blockquote>
<p>Vue 2 已于 2023-12-31 停止维护，本题 Vue 2 部分以 2.7 为准。props 单向数据流、插槽与 provide/inject 的取舍分别见<a href="/questions/vue-props/">《为什么 Vue 提倡 props 单向数据流？》</a>和<a href="/questions/vue-slots-provide/">《插槽、作用域插槽和 provide/inject 各解决什么问题？》</a>。</p>
</blockquote>
<h2>简答</h2>
<blockquote>
<p>Vue 2 里父子通信首选 props 向下传、<code>$emit</code> 向上发事件。需要“双向”时用 <code>v-model</code> 或 <code>.sync</code>，它们只是语法糖，本质还是 prop 加事件。</p>
<p>其他方式按耦合程度排：包装组件用 <code>$attrs</code> 和 <code>$listeners</code> 把属性和监听器透传给内部元素；跨很多层用 <code>provide/inject</code>；全局共享状态用 Vuex；<code>$parent</code>、<code>$refs</code> 直接拿到组件实例，耦合最强；任意组件之间还可以用 <code>new Vue()</code> 做一个 EventBus。</p>
<p>到了 Vue 3，有几处变了。<code>$listeners</code> 被移除，监听器以 <code>onXxx</code> 的形式并进了 <code>$attrs</code>，<code>$attrs</code> 也开始包含 <code>class</code> 和 <code>style</code>。<code>.sync</code> 和 <code>model</code> 选项被移除，改成 <code>v-model:title</code>，组件 v-model 默认的 prop 和事件也从 <code>value</code>/<code>input</code> 变成了 <code>modelValue</code>/<code>update:modelValue</code>。</p>
<p>还有一处影响很大：实例上的 <code>$on</code>、<code>$off</code>、<code>$once</code> 没了，所以基于 <code>new Vue()</code> 的 EventBus 不能用了，官方建议换成 mitt、tiny-emitter 这类库。官方推荐的状态管理也从 Vuex 变成了 Pinia。</p>
</blockquote>
<h2>Vue 2 的通信方式一览</h2>
<table><thead><tr><th>方式</th><th>方向</th><th>说明</th></tr></thead><tbody><tr><td>props / <code>$emit</code></td><td>父 → 子 / 子 → 父</td><td>最常用，数据流清晰</td></tr><tr><td><code>v-model</code> / <code>.sync</code></td><td>双向语法糖</td><td><code>:title.sync=&quot;t&quot;</code> 等价于 <code>:title=&quot;t&quot; @update:title=&quot;t = $event&quot;</code></td></tr><tr><td><code>$attrs</code> / <code>$listeners</code></td><td>透传</td><td>包装组件把未声明的属性和监听器转交给内部元素</td></tr><tr><td><code>$parent</code> / <code>$children</code> / <code>$refs</code></td><td>直接访问实例</td><td>便捷但耦合重，适合调用子组件方法</td></tr><tr><td>provide / inject</td><td>祖先 → 后代</td><td>Vue 2 中注入的值默认不是响应式，除非提供的是响应式对象</td></tr><tr><td>EventBus</td><td>任意组件</td><td><code>const bus = new Vue()</code>，用 <code>$on</code>/<code>$emit</code>/<code>$off</code></td></tr><tr><td>Vuex</td><td>全局</td><td>集中管理共享状态</td></tr></tbody></table>
<h2>为什么 $listeners 并进了 $attrs</h2>
<p>在 Vue 3 的虚拟 DOM 里，事件监听器就是名字带 <code>on</code> 前缀的普通属性，比如 <code>onClick</code>。既然它们本来就是属性，再单独放一个 <code>$listeners</code> 就没必要了，所以统一归到 <code>$attrs</code> 里。</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- Vue 2 --&gt;
&lt;input v-bind=&quot;$attrs&quot; v-on=&quot;$listeners&quot; /&gt;

&lt;!-- Vue 3 --&gt;
&lt;input v-bind=&quot;$attrs&quot; /&gt;
</code></pre></div>
<p>两个版本都可以配合 <code>inheritAttrs: false</code> 控制透传到哪个元素。要注意，Vue 3 的 <code>$attrs</code> 包含 <code>class</code> 和 <code>style</code>，所以关掉 <code>inheritAttrs</code> 以后，它们也不会自动落到根元素上了，这是迁移时容易漏的地方。</p>
<h2>.sync 改成了 v-model 参数</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- Vue 2 --&gt;
&lt;ChildComponent :title.sync=&quot;pageTitle&quot; /&gt;

&lt;!-- Vue 3 --&gt;
&lt;ChildComponent v-model:title=&quot;pageTitle&quot; /&gt;
</code></pre></div>
<p>子组件这边不用改，仍然是 <code>emit(&#x27;update:title&#x27;, value)</code>。Vue 3 允许同一个组件绑定多个 <code>v-model</code>，<code>.sync</code> 的用途就被覆盖了，组件的 <code>model</code> 选项也随之移除。</p>
<h2>EventBus 为什么不能用了</h2>
<p>Vue 2 的 EventBus 是借用了组件实例自带的 <code>$on</code>、<code>$emit</code>、<code>$off</code>。Vue 3 的组件实例不再实现这套事件接口，<code>new Vue()</code> 也没了，这个写法就失效了。要保留事件总线，可以换成专门的库：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// Vue 3：用 mitt 替代 new Vue() 作为事件总线</span>
<span class="hljs-keyword">import</span> mitt <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;mitt&#x27;</span>;
<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> bus = <span class="hljs-title function_">mitt</span>();

bus.<span class="hljs-title function_">on</span>(<span class="hljs-string">&#x27;saved&#x27;</span>, handler);
bus.<span class="hljs-title function_">emit</span>(<span class="hljs-string">&#x27;saved&#x27;</span>, payload);
bus.<span class="hljs-title function_">off</span>(<span class="hljs-string">&#x27;saved&#x27;</span>, handler);
</code></pre></div>
<p>不过迁移指南同时提醒，大多数情况下不建议用全局事件总线，事件从哪发、谁在听很难追踪。优先考虑 props 和事件、provide/inject 或者全局状态管理。<code>$emit</code> 本身还在，用来触发父组件监听的事件。</p>
<h2>其他变化</h2>
<p><code>$children</code> 被移除了，要访问子组件改用模板 ref。Vuex 4 仍然支持 Vue 3，但官方文档说明 Vuex 已进入维护模式，新项目推荐用 Pinia。</p>
<h2>常见追问</h2>
<p><strong>Vue 3 里子组件 emit 的事件需要声明吗？</strong></p>
<blockquote>
<p>推荐用 <code>emits</code> 选项或 <code>defineEmits</code> 声明。没声明的监听器会留在 <code>$attrs</code> 里，默认透传到子组件的根元素上，可能导致同一个事件触发两次。</p>
</blockquote>
<p><strong>迁移时 .sync 和 $listeners 能先临时保留吗？</strong></p>
<blockquote>
<p>可以。<code>@vue/compat</code> 迁移构建提供了 <code>COMPONENT_V_MODEL</code>、<code>INSTANCE_LISTENERS</code>、<code>INSTANCE_EVENT_EMITTER</code> 等兼容开关，可以先跑起来，再一项项替换。</p>
</blockquote>`};export{e as default};