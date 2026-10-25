var e={answerHtml:`<p>一个页面的标题和正文已经准备好，但推荐内容还要等待较慢的查询。如果服务器坚持把整页全部准备好再返回，用户会被最慢的区域拖住。</p>
<p>流式 SSR 可以先输出已经就绪的外壳及占位内容，随后逐步发送其他区域。它改善的是不同内容之间的等待组织，不会自动让数据库查询变快，也不是给任意异步代码加上 Suspense 就全部解决。</p>
<h2>Shell 与 Suspense 分别负责什么</h2>
<p>Shell 可以理解为不需要继续等待外层 Suspense 内容就能输出的初始结构。通常应包含有意义的页面骨架、导航或主要信息，而不只是一个空 loading。</p>
<p>Suspense 边界指定某部分等待时显示什么 fallback。适当划分后，较慢的推荐区域可以等待，已经准备好的正文不必一起隐藏。</p>
<p>但 Suspense 只会响应支持它的暂停机制。普通组件在 useEffect 中发起请求，不会因此自动让服务端等待那个 Effect。数据获取需要由框架或支持的 React 数据读取方式组织，不能把任意 Promise 放在外面就假定已经接入。</p>
<h2>Node.js 中怎样开始发送</h2>
<p>renderToPipeableStream 返回 pipe 与 abort。onShellReady 表示外壳已可发送，onAllReady 表示所有服务端渲染内容已准备好。</p>
<p>下面是一个最小的响应辅助函数。tree 由调用者提供，应是完整文档的 React 树；bootstrapModules 指向真实构建出的客户端入口，也可以为空表示不启动相应客户端应用。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { renderToPipeableStream } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react-dom/server&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">streamPage</span>(<span class="hljs-params">response, tree, { bootstrapModules = [] } = {}</span>) {
  <span class="hljs-keyword">let</span> didError = <span class="hljs-literal">false</span>;

  <span class="hljs-keyword">const</span> { pipe, abort } = <span class="hljs-title function_">renderToPipeableStream</span>(tree, {
    bootstrapModules,
    <span class="hljs-title function_">onShellReady</span>(<span class="hljs-params"></span>) {
      <span class="hljs-keyword">if</span> (response.<span class="hljs-property">destroyed</span>) <span class="hljs-keyword">return</span>;
      response.<span class="hljs-property">statusCode</span> = didError ? <span class="hljs-number">500</span> : <span class="hljs-number">200</span>;
      response.<span class="hljs-title function_">setHeader</span>(<span class="hljs-string">&#x27;Content-Type&#x27;</span>, <span class="hljs-string">&#x27;text/html; charset=utf-8&#x27;</span>);
      <span class="hljs-title function_">pipe</span>(response);
    },
    <span class="hljs-title function_">onShellError</span>(<span class="hljs-params"></span>) {
      <span class="hljs-keyword">if</span> (response.<span class="hljs-property">destroyed</span> || response.<span class="hljs-property">headersSent</span>) <span class="hljs-keyword">return</span>;
      response.<span class="hljs-property">statusCode</span> = <span class="hljs-number">500</span>;
      response.<span class="hljs-title function_">setHeader</span>(<span class="hljs-string">&#x27;Content-Type&#x27;</span>, <span class="hljs-string">&#x27;text/html; charset=utf-8&#x27;</span>);
      response.<span class="hljs-title function_">end</span>(<span class="hljs-string">&#x27;&lt;!doctype html&gt;&lt;html lang=&quot;zh-CN&quot;&gt;&lt;title&gt;加载失败&lt;/title&gt;&lt;body&gt;&lt;h1&gt;页面暂时无法加载。&lt;/h1&gt;&lt;/body&gt;&lt;/html&gt;&#x27;</span>);
    },
    <span class="hljs-title function_">onError</span>(<span class="hljs-params">error</span>) {
      didError = <span class="hljs-literal">true</span>;
      <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">error</span>(<span class="hljs-string">&#x27;服务端渲染失败&#x27;</span>, error);
    },
  });

  <span class="hljs-keyword">const</span> timer = <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">abort</span>(), <span class="hljs-number">10_000</span>);
  <span class="hljs-keyword">const</span> <span class="hljs-title function_">cleanup</span> = (<span class="hljs-params"></span>) =&gt; <span class="hljs-built_in">clearTimeout</span>(timer);
  response.<span class="hljs-title function_">once</span>(<span class="hljs-string">&#x27;finish&#x27;</span>, cleanup);
  response.<span class="hljs-title function_">once</span>(<span class="hljs-string">&#x27;close&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
    <span class="hljs-title function_">cleanup</span>();
    <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">writableFinished</span>) <span class="hljs-title function_">abort</span>();
  });

  <span class="hljs-keyword">return</span> { abort };
}
</code></pre></div>
<p>调用者还需要负责路由、数据、权限、缓存与客户端入口，这不是完整的服务器应用。示例在响应写出结束或连接关闭时清理计时器，客户端提前断开时停止相应 React 渲染。</p>
<p>renderToPipeableStream 针对 Node.js 可写流；使用 Web Streams 的运行环境通常考虑 renderToReadableStream，不要把 Node response.pipe 的接法原样套到所有边缘平台。</p>
<h2>为什么必须区分发送前与发送后的错误</h2>
<p>Shell 渲染失败时，尚未发送页面流，可以选择完整的错误 HTML 和相应状态码。某个 Suspense 内部区域失败，则可能保留 fallback，并让客户端按相应机制尝试恢复。</p>
<p>一旦响应头或正文已经开始发送，就不能随意改回新的 HTTP 状态，也不能把前面发出的 HTML 撤销。示例只在 Shell 发送时根据已知错误选择状态；真实业务还应区分 404、权限失败和可恢复的局部错误。</p>
<p>不能因为流已用 200 开始，就把后续所有异常视为成功。需要记录具体区域和发布版本，并在客户端与服务端共同提供错误边界或重试入口。</p>
<h2>abort 不等于所有后台工作都取消</h2>
<p>React 的 abort 用于中止尚未完成的服务端渲染，并可让未完成部分交给客户端按相应机制处理。它不会自动取消你的数据库查询、所有外部 fetch，也不会回滚已经发生的业务写入。</p>
<p>底层任务需要自己的信号、超时和清理。若客户端没有对应恢复能力，超时后剩下的区域如何展示也要另行设计，不能只设置一个十秒计时器就声称整个页面可靠可用。</p>
<p>响应 finish 也不表示用户已经看见或成功交互，只表示服务器响应写出流程达到了相应阶段。</p>
<h2>流完成与 hydration 完成是两条进度</h2>
<p>HTML 可以先到达并显示，客户端代码随后加载与接管。支持相应机制时，React 可以围绕 Suspense 等边界协调不同区域的 hydration，不必把“整条流全部结束”当作所有交互的唯一开始条件。</p>
<p>但流式输出本身不会替代 hydration，也不会消除客户端 JavaScript 成本。服务端与客户端初始数据和结构仍需对应，客户端脚本失败时也可能留下可见但无法按应用逻辑操作的区域。</p>
<p>严格 CSP、流式替换所需脚本和客户端入口等，应按框架与 React 的要求正确配置，包括适用的 nonce 等信息，不能只验证服务器确实写出了几段字符串。</p>
<h2>中间层可能把流重新缓冲起来</h2>
<p>反向代理、CDN 和压缩层可能积累一批内容后才交给浏览器。服务器日志显示先发送了 Shell，不代表用户真的提前收到它。</p>
<p>验证应观察客户端接收和显示的时间，而不只看服务端回调。还要控制过多边界造成的碎片与复杂度，并给占位区域合理尺寸，避免后续内容到达时产生明显布局移动。</p>
<p>如果等 onAllReady 才开始 pipe，通常能拿到完整内容，但失去逐步输出的主要收益。它适合某些静态生成或完整内容处理需求，不能同时宣称仍获得相同的渐进显示效果。</p>
<p>构建阶段也可以用渲染 API生成最终静态文件；这不意味着普通静态托管会在每次访问时运行流式 SSR。是否值得采用请求时流式渲染，应结合慢数据、部署能力以及实际首屏和交互指标决定。</p>`};export{e as default};