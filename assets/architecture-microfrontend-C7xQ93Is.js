var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>微前端主要解决的是组织问题，不是技术问题。一个产品由好几个团队负责不同的部分，每个团队都想按自己的节奏开发、部署和回滚，这时才需要微前端。</p>
<p>集成方式大致三类：构建时集成，也就是把子应用发成 npm 包；运行时集成，比如 Module Federation、import maps、qiankun；还有 iframe。只有运行时集成和 iframe 能真正独立部署。</p>
<p>代价是很多原本不用操心的事都要自己处理：共享依赖的版本、样式隔离、全局状态、一个子应用挂了别拖垮整页。子应用之间只能通过明确的契约通信，比如路由、事件和少量共享数据，不能互相访问内部实现。</p>
<p>所以要注意，如果团队不多、发布节奏也一致，一个模块划分得好的单体应用通常更简单。</p>
</blockquote>
<h2>什么时候值得用</h2>
<p>第一种情况是产品由多个团队负责，每个团队需要独立发布。第二种是要渐进迁移旧系统，比如在旧的 AngularJS 应用里，一页一页换成 React。第三种是不同部分对技术栈确实有不同要求。</p>
<p>反过来，如果所有代码都是一个团队在维护，微前端带来的协调成本往往比收益大。按功能把模块分好就够了。</p>
<h2>几种集成方式怎么比</h2>
<table><thead><tr><th>方式</th><th>独立部署</th><th>隔离性</th><th>主要成本</th></tr></thead><tbody><tr><td>构建时（npm 包）</td><td>否，主应用要重新构建</td><td>无</td><td>发布要串行协调</td></tr><tr><td>Module Federation</td><td>是</td><td>弱，共享同一个页面</td><td>共享依赖版本协商</td></tr><tr><td>import maps + ES 模块</td><td>是</td><td>弱</td><td>手动管理模块地址和共享依赖</td></tr><tr><td>qiankun / single-spa</td><td>是</td><td>JS 沙箱和样式隔离（不完全）</td><td>框架自身复杂度</td></tr><tr><td>iframe</td><td>是</td><td>强</td><td>通信、路由同步、弹窗和样式统一困难</td></tr></tbody></table>
<p>构建时集成看起来最简单，但子应用一更新，主应用就得重新构建发布，团队之间还是绑在一起。iframe 隔离最彻底，可正因为隔得太开，通信、路由同步、弹窗盖住整页这些事都变难了。</p>
<h2>Module Federation 是哪一类</h2>
<p>Module Federation 属于运行时集成：一个应用在运行时加载另一个应用暴露出来的模块，React 这类库通过共享依赖的单例配置只加载一份。具体的 exposes、remotes、shared 配置和 <code>React.lazy</code> 加载写法，见<a href="/questions/arch-module-federation/">《怎样用 Module Federation 做微前端？exposes、remotes 和 shared 怎样配置？》</a>。</p>
<h2>用了以后必须处理哪些问题</h2>
<p>共享依赖是第一个。版本不一致时，同一个库可能被加载好几份，体积变大，像 React 这种只能有一份的库还会直接出错。所以要约定共享库的版本范围和升级流程。</p>
<p>样式冲突是第二个。可以用 CSS Modules、命名前缀或 Shadow DOM 隔离，全局样式只由主应用提供。</p>
<p>故障隔离是第三个。子应用加载失败或运行报错时，主应用要用错误边界显示降级内容，不能让整页白屏。</p>
<p>契约和回滚是最后一个。路由前缀、跨应用的事件名、共享数据的格式，都要写成文档并做版本管理。每个子应用能独立回滚，前提是它和主应用之间的契约是向后兼容的。</p>
<h2>常见追问</h2>
<p><strong>登录状态怎么共享？</strong></p>
<blockquote>
<p>由主应用负责登录，通过 Cookie 或共享的上下文把用户信息提供给子应用。子应用不要各自实现一套登录。</p>
</blockquote>
<p><strong>微前端会影响性能吗？</strong></p>
<blockquote>
<p>会。请求变多，还可能有重复代码。需要靠共享依赖和合理的预加载来弥补。</p>
</blockquote>`};export{e as default};