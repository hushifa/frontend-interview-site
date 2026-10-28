var e={answerHtml:`<blockquote>
<p>Vue 2 已于 2023-12-31 停止维护，本题 Vue 2 部分以 2.7 为准。通信写法的具体改动见<a href="/questions/vue2-communication/">《Vue 2 有哪些组件通信方式？哪些写法在 Vue 3 中被移除或改变？》</a>。</p>
</blockquote>
<h2>简答</h2>
<ul>
<li>先评估能否迁移：依赖 Vue 2 内部 API 的库、尚无 Vue 3 版本的组件库、必须支持 IE11 的项目，都可能需要暂留 Vue 2。</li>
<li>可以先升级到 Vue 2.7：它内置组合式 API、<code>&lt;script setup&gt;</code> 和 SFC CSS <code>v-bind</code>，能在 Vue 2 上提前改写代码，缩小之后的差异。</li>
<li>正式迁移可用 <code>@vue/compat</code>：它是可配置 Vue 2 兼容行为的 Vue 3 构建，默认以 Vue 2 模式运行，对废弃用法发出警告，可以逐项修复。</li>
<li>主要破坏性变更包括 <code>createApp</code> 取代 <code>new Vue()</code>、组件 <code>v-model</code> 重做并移除 <code>.sync</code>、<code>$listeners</code>/<code>$on</code>/filters 移除、<code>beforeDestroy</code>/<code>destroyed</code> 改名、过渡类名变化等。</li>
<li>生态同步升级：vue-router 4、Vuex 4（或改用官方推荐的 Pinia）、<code>vue-template-compiler</code> 换成 <code>@vue/compiler-sfc</code>。</li>
</ul>
<h2>第一步：评估依赖与环境</h2>
<p>迁移构建文档列出了几类限制：</p>
<ul>
<li>依赖 Vue 2 内部 API 或未公开行为的库，最常见的是访问 VNode 私有属性。</li>
<li>依赖 Vuetify、Quasar、ElementUI 等组件库时，最好等它们的 Vue 3 兼容版本。</li>
<li>Vue 3 不支持 IE11，需要支持 IE11 的项目只能留在 Vue 2。</li>
<li>自定义 SSR 迁移成本更高，<code>vue-server-renderer</code> 要换成 <code>@vue/server-renderer</code>。</li>
</ul>
<h2>第二步：在 Vue 2.7 上提前改写</h2>
<p>2.7 发布说明列出的移植功能有组合式 API、SFC <code>&lt;script setup&gt;</code>、SFC CSS <code>v-bind</code>，以及 <code>defineComponent()</code> 的类型推断改进。原先使用 <code>@vue/composition-api</code> 插件的项目，把导入改成从 <code>vue</code> 导入即可。</p>
<p>同时要知道 2.7 的边界：组合式 API 基于 Vue 2 的 getter/setter 响应式实现；<code>createApp()</code>、<code>&lt;script setup&gt;</code> 中的顶层 <code>await</code>、模板表达式中的 TypeScript 语法和 Reactivity Transform 没有移植。</p>
<p>这一阶段还可以先清理迁移后不再支持的写法：废弃的具名/作用域插槽语法（2.6 已支持新语法）、filters、<code>$listeners</code>、<code>.sync</code>、EventBus 等。</p>
<h2>第三步：用 @vue/compat 切换到 Vue 3</h2>
<p>迁移构建文档给出的流程：</p>
<ol>
<li>升级工具链：自定义 webpack 升级 <code>vue-loader</code> 到 16；Vue CLI 用 <code>vue upgrade</code>，或改用 Vite。</li>
<li>在 <code>package.json</code> 中把 <code>vue</code> 升到 3，安装同版本的 <code>@vue/compat</code>，用 <code>@vue/compiler-sfc</code> 替换 <code>vue-template-compiler</code>。</li>
<li>构建配置中把 <code>vue</code> 别名指向 <code>@vue/compat</code>，并在编译选项中设置 <code>compatConfig: { MODE: 2 }</code>。</li>
</ol>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// vite.config.js</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> {
  <span class="hljs-attr">resolve</span>: { <span class="hljs-attr">alias</span>: { <span class="hljs-attr">vue</span>: <span class="hljs-string">&#x27;@vue/compat&#x27;</span> } },
  <span class="hljs-attr">plugins</span>: [
    <span class="hljs-title function_">vue</span>({ <span class="hljs-attr">template</span>: { <span class="hljs-attr">compilerOptions</span>: { <span class="hljs-attr">compatConfig</span>: { <span class="hljs-attr">MODE</span>: <span class="hljs-number">2</span> } } } }),
  ],
};
</code></pre></div>
<ol start="4">
<li>先修复编译期错误（如 filters），再逐个处理浏览器控制台中的运行时警告。每个警告有 ID，例如 <code>GLOBAL_MOUNT</code>（<code>new Vue()</code> → <code>createApp</code>）、<code>OPTIONS_BEFORE_DESTROY</code>。</li>
<li>过渡类名变化是唯一没有运行时警告的特性，需要全局搜索 <code>.*-enter</code>、<code>.*-leave</code> 类名。</li>
<li>改用 <code>createApp</code> 挂载，升级 Vuex 4 和 vue-router 4。</li>
<li>冲突较大的组件可以通过 <code>compatConfig</code> 选项按组件切换到 Vue 3 行为；警告全部清除后移除迁移构建。</li>
</ol>
<h2>状态管理：Vuex → Pinia</h2>
<p>Vue 官方文档说明 Pinia 已承担 Vuex 的角色，Vuex 进入维护模式，新项目推荐 Pinia。迁移时可以先升级 Vuex 4 保证运行，再按模块逐步改写为 Pinia store。</p>
<h2>常见追问</h2>
<ul>
<li>为什么不直接重写？大型项目一次性重写风险高；2.7 + 迁移构建允许应用在每一步都保持可运行。</li>
<li>迁移构建能长期使用吗？不能。它的目的是过渡，部分特性在 Vue 2 和 Vue 3 中行为冲突，最终需要移除并切换到正式的 Vue 3。</li>
<li>必须先用组合式 API 吗？不必。Vue 3 仍完整支持选项式 API，组合式 API 是可选的改写方向。</li>
</ul>`};export{e as default};