var e={answerHtml:`<blockquote>
<p>Vue 2 已于 2023-12-31 停止维护，本题 Vue 2 部分以 2.7 为准。通信写法的具体改动见<a href="/questions/vue2-communication/">《Vue 2 有哪些组件通信方式？哪些写法在 Vue 3 中被移除或改变？》</a>。</p>
</blockquote>
<h2>简答</h2>
<blockquote>
<p>我会分三步走。第一步先评估能不能迁：依赖 Vue 2 内部 API 的库、还没有 Vue 3 版本的组件库、必须支持 IE11 的项目，都可能要暂时留在 Vue 2。</p>
<p>第二步先升级到 Vue 2.7。它内置了组合式 API、<code>&lt;script setup&gt;</code> 和单文件组件 CSS 里的 <code>v-bind</code>，可以在 Vue 2 上提前改写代码，把之后的差距缩小。</p>
<p>第三步用 <code>@vue/compat</code> 正式切换。它是一个可以配置 Vue 2 兼容行为的 Vue 3 构建，默认按 Vue 2 的方式运行，遇到废弃用法就发警告，可以一项项修。主要的破坏性变更有：<code>createApp</code> 取代 <code>new Vue()</code>，组件 <code>v-model</code> 重做并移除 <code>.sync</code>，<code>$listeners</code>、<code>$on</code>、filters 被移除，<code>beforeDestroy</code>/<code>destroyed</code> 改名，过渡类名变化等。</p>
<p>生态也要一起升：vue-router 4、Vuex 4 或者改用官方推荐的 Pinia，<code>vue-template-compiler</code> 换成 <code>@vue/compiler-sfc</code>。</p>
</blockquote>
<h2>第一步：先评估依赖和运行环境</h2>
<p>迁移构建文档列出了几类限制。依赖 Vue 2 内部 API 或未公开行为的库最麻烦，最常见的是访问 VNode 的私有属性。用了 Vuetify、Quasar、ElementUI 这类组件库，最好等它们出 Vue 3 兼容版本。Vue 3 不支持 IE11，必须支持 IE11 的项目只能留在 Vue 2。自己搭的 SSR 迁移成本更高，<code>vue-server-renderer</code> 要换成 <code>@vue/server-renderer</code>。</p>
<p>这一步的意义在于，有些障碍不是改代码能解决的，要先弄清楚再动手。</p>
<h2>第二步：在 Vue 2.7 上提前改写</h2>
<p>2.7 发布说明列出的移植功能有组合式 API、单文件组件的 <code>&lt;script setup&gt;</code>、CSS <code>v-bind</code>，以及 <code>defineComponent()</code> 的类型推断改进。原来用 <code>@vue/composition-api</code> 插件的项目，把导入改成从 <code>vue</code> 导入就行。</p>
<p>不过 2.7 有边界。它的组合式 API 底层还是 Vue 2 的 getter/setter 响应式；<code>createApp()</code>、<code>&lt;script setup&gt;</code> 里的顶层 <code>await</code>、模板表达式里的 TypeScript 语法和 Reactivity Transform 都没有移植。</p>
<p>为什么要多这一步，不直接上 Vue 3？因为在 2.7 上改写时，应用一直能正常运行，可以按模块慢慢来。这一阶段还可以顺手清理迁移后不再支持的写法：废弃的具名/作用域插槽语法（2.6 已支持新语法）、filters、<code>$listeners</code>、<code>.sync</code>、EventBus 等。</p>
<h2>第三步：用 @vue/compat 切到 Vue 3</h2>
<p>迁移构建文档给出的流程是这样的。先升级工具链：自定义 webpack 的把 <code>vue-loader</code> 升到 16；用 Vue CLI 的执行 <code>vue upgrade</code>，或者改用 Vite。然后在 <code>package.json</code> 里把 <code>vue</code> 升到 3，装同版本的 <code>@vue/compat</code>，用 <code>@vue/compiler-sfc</code> 替换 <code>vue-template-compiler</code>。最后在构建配置里把 <code>vue</code> 的别名指向 <code>@vue/compat</code>，并在编译选项里设置 <code>compatConfig: { MODE: 2 }</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// vite.config.js</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> {
  <span class="hljs-attr">resolve</span>: { <span class="hljs-attr">alias</span>: { <span class="hljs-attr">vue</span>: <span class="hljs-string">&#x27;@vue/compat&#x27;</span> } },
  <span class="hljs-attr">plugins</span>: [
    <span class="hljs-title function_">vue</span>({ <span class="hljs-attr">template</span>: { <span class="hljs-attr">compilerOptions</span>: { <span class="hljs-attr">compatConfig</span>: { <span class="hljs-attr">MODE</span>: <span class="hljs-number">2</span> } } } }),
  ],
};
</code></pre></div>
<p>跑起来以后，先修编译期的错误，比如 filters，再一个个处理浏览器控制台里的运行时警告。每个警告都有 ID，比如 <code>GLOBAL_MOUNT</code> 表示 <code>new Vue()</code> 要换成 <code>createApp</code>，<code>OPTIONS_BEFORE_DESTROY</code> 表示 <code>beforeDestroy</code> 要改名。</p>
<p>有一项要特别留意：过渡类名的变化是唯一没有运行时警告的特性，得自己全局搜索 <code>.*-enter</code>、<code>.*-leave</code> 这类类名。</p>
<p>接着改用 <code>createApp</code> 挂载，升级 Vuex 4 和 vue-router 4。冲突比较大的组件，可以通过 <code>compatConfig</code> 选项单独切到 Vue 3 的行为。警告全部清掉以后，移除迁移构建。</p>
<h2>状态管理从 Vuex 换到 Pinia</h2>
<p>Vue 官方文档说明，Pinia 已经接替了 Vuex 的角色，Vuex 进入维护模式，新项目推荐 Pinia。迁移时可以先升级到 Vuex 4 保证能跑，再按模块逐步改写成 Pinia store。</p>
<h2>常见追问</h2>
<p><strong>为什么不直接重写？</strong></p>
<blockquote>
<p>大型项目一次性重写风险太高。先升 2.7、再用迁移构建，应用在每一步都能保持可运行，出了问题也容易定位。</p>
</blockquote>
<p><strong>迁移构建能一直用下去吗？</strong></p>
<blockquote>
<p>不能。它就是为过渡准备的，有些特性在 Vue 2 和 Vue 3 中行为冲突，最终还是要移除它，切到正式的 Vue 3。</p>
</blockquote>
<p><strong>必须先改成组合式 API 吗？</strong></p>
<blockquote>
<p>不必。Vue 3 仍然完整支持选项式 API，组合式 API 只是一个可选的改写方向。</p>
</blockquote>`};export{e as default};