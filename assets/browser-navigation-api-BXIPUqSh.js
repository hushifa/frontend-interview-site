var e={answerHtml:`<p>传统 SPA 路由往往需要自己组合很多入口：拦截链接 click、调用 pushState、监听 popstate、加载新内容，再处理前进后退、取消、滚动和焦点。只监听链接点击，还会漏掉程序发起的导航和历史遍历等场景。</p>
<p>Navigation API 把导航动作、历史条目和异步处理过程放进更统一的模型中。它帮助浏览器理解“应用正在处理一次导航”，而不只是看见 URL 被修改。</p>
<p>核心能力目前已进入 Baseline 2026，不能再笼统称为只在实验浏览器里存在的 API。但旧版本浏览器、内嵌 WebView 和较新的子功能仍要分别核实支持，框架也不一定采用同一套集成方式。</p>
<h2>navigate 事件提供了更多导航上下文</h2>
<p>通过 <code>window.navigation</code> 可以监听 navigate。事件包含目标 URL、导航类型、是否能拦截、是否是片段变化、下载或表单提交等信息，还有与这次导航关联的 AbortSignal。</p>
<p><code>event.intercept()</code> 可以把允许拦截的导航交给应用，并转成同文档处理。它不只是在已经发生的同文档路由上加一个回调，也可以把本来可能加载新文档的合适导航转成 SPA 更新。</p>
<p>但不是所有导航都能拦截。应先检查 canIntercept，并只处理应用拥有的路由；跨源链接、下载、原生表单流程和不认识的地址不应被一个全局监听器全部吞掉。</p>
<p><code>hashChange</code>、<code>downloadRequest</code>、<code>formData</code> 等也有不同含义。尤其 downloadRequest 可能是空字符串文件名，不能只用真假值判断“有没有下载请求”，应按它是否为 null 判断。</p>
<h2>一个读取静态 JSON 的最小路由示例</h2>
<p>假设 <code>/guide/</code> 和 <code>/faq/</code> 都有可直接访问的 HTML 页面，客户端增强时分别读取 <code>/data/guide.json</code> 与 <code>/data/faq.json</code>。JSON 约定为 <code>{ &quot;title&quot;: &quot;标题&quot;, &quot;content&quot;: &quot;纯文本正文&quot; }</code>。</p>
<p>下面传入真实的主内容容器。示例只接管这两个没有查询参数的路由，不处理文章 HTML 注入、权限和复杂嵌套路由：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">installArticleNavigation</span>(<span class="hljs-params">outlet</span>) {
  <span class="hljs-keyword">if</span> (!(<span class="hljs-string">&#x27;navigation&#x27;</span> <span class="hljs-keyword">in</span> <span class="hljs-variable language_">window</span>) || <span class="hljs-keyword">typeof</span> <span class="hljs-title class_">AbortSignal</span>.<span class="hljs-property">any</span> !== <span class="hljs-string">&#x27;function&#x27;</span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {};
  }

  <span class="hljs-keyword">const</span> routes = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>([
    [<span class="hljs-string">&#x27;/guide/&#x27;</span>, <span class="hljs-string">&#x27;/data/guide.json&#x27;</span>],
    [<span class="hljs-string">&#x27;/faq/&#x27;</span>, <span class="hljs-string">&#x27;/data/faq.json&#x27;</span>],
  ]);
  <span class="hljs-keyword">const</span> lifetime = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
  <span class="hljs-keyword">let</span> sequence = <span class="hljs-number">0</span>;

  navigation.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;navigate&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (
      event.<span class="hljs-property">defaultPrevented</span> ||
      !event.<span class="hljs-property">canIntercept</span> ||
      event.<span class="hljs-property">hashChange</span> ||
      event.<span class="hljs-property">downloadRequest</span> !== <span class="hljs-literal">null</span> ||
      event.<span class="hljs-property">formData</span> !== <span class="hljs-literal">null</span>
    ) {
      <span class="hljs-keyword">return</span>;
    }

    <span class="hljs-keyword">const</span> url = <span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(event.<span class="hljs-property">destination</span>.<span class="hljs-property">url</span>);
    <span class="hljs-keyword">const</span> dataUrl = routes.<span class="hljs-title function_">get</span>(url.<span class="hljs-property">pathname</span>);
    <span class="hljs-keyword">if</span> (url.<span class="hljs-property">origin</span> !== location.<span class="hljs-property">origin</span> || url.<span class="hljs-property">search</span> || !dataUrl) <span class="hljs-keyword">return</span>;

    <span class="hljs-keyword">const</span> id = ++sequence;
    <span class="hljs-keyword">const</span> signal = <span class="hljs-title class_">AbortSignal</span>.<span class="hljs-title function_">any</span>([event.<span class="hljs-property">signal</span>, lifetime.<span class="hljs-property">signal</span>]);

    event.<span class="hljs-title function_">intercept</span>({
      <span class="hljs-keyword">async</span> <span class="hljs-title function_">handler</span>(<span class="hljs-params"></span>) {
        signal.<span class="hljs-title function_">throwIfAborted</span>();
        outlet.<span class="hljs-title function_">setAttribute</span>(<span class="hljs-string">&#x27;aria-busy&#x27;</span>, <span class="hljs-string">&#x27;true&#x27;</span>);
        <span class="hljs-keyword">try</span> {
          <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(dataUrl, { signal });
          <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`页面请求失败：HTTP <span class="hljs-subst">\${response.status}</span>\`</span>);
          <span class="hljs-keyword">const</span> data = <span class="hljs-keyword">await</span> response.<span class="hljs-title function_">json</span>();
          <span class="hljs-keyword">if</span> (!data || <span class="hljs-keyword">typeof</span> data.<span class="hljs-property">title</span> !== <span class="hljs-string">&#x27;string&#x27;</span> || <span class="hljs-keyword">typeof</span> data.<span class="hljs-property">content</span> !== <span class="hljs-string">&#x27;string&#x27;</span>) {
            <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;页面数据格式不正确&#x27;</span>);
          }
          signal.<span class="hljs-title function_">throwIfAborted</span>();
          <span class="hljs-keyword">if</span> (id !== sequence) <span class="hljs-keyword">return</span>;

          <span class="hljs-keyword">const</span> heading = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;h1&#x27;</span>);
          <span class="hljs-keyword">const</span> paragraph = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;p&#x27;</span>);
          heading.<span class="hljs-property">textContent</span> = data.<span class="hljs-property">title</span>;
          paragraph.<span class="hljs-property">textContent</span> = data.<span class="hljs-property">content</span>;
          outlet.<span class="hljs-title function_">replaceChildren</span>(heading, paragraph);
          <span class="hljs-variable language_">document</span>.<span class="hljs-property">title</span> = data.<span class="hljs-property">title</span>;
        } <span class="hljs-keyword">catch</span> (error) {
          <span class="hljs-keyword">if</span> (!signal.<span class="hljs-property">aborted</span> &amp;&amp; id === sequence) {
            outlet.<span class="hljs-property">textContent</span> = <span class="hljs-string">&#x27;页面加载失败，请重试或刷新页面。&#x27;</span>;
            <span class="hljs-variable language_">document</span>.<span class="hljs-property">title</span> = <span class="hljs-string">&#x27;页面加载失败&#x27;</span>;
          }
          <span class="hljs-keyword">throw</span> error;
        } <span class="hljs-keyword">finally</span> {
          <span class="hljs-keyword">if</span> (id === sequence) outlet.<span class="hljs-title function_">removeAttribute</span>(<span class="hljs-string">&#x27;aria-busy&#x27;</span>);
        }
      },
    });
  }, { <span class="hljs-attr">signal</span>: lifetime.<span class="hljs-property">signal</span> });

  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {
    sequence += <span class="hljs-number">1</span>;
    lifetime.<span class="hljs-title function_">abort</span>();
    outlet.<span class="hljs-title function_">removeAttribute</span>(<span class="hljs-string">&#x27;aria-busy&#x27;</span>);
  };
}
</code></pre></div>
<p>组件或路由系统销毁时调用清理函数。缺少这里所需能力时不注册拦截，普通链接继续走文档导航，因此部署必须真的提供这些地址的页面或正确的服务器路由，不能只在首页能打开时就认为深链接可用。</p>
<p>示例通过 textContent 展示数据，不把接口里的字符串直接写进 innerHTML。项目使用成熟框架路由时，也不应再随手添加另一个全局拦截器与它争用导航。</p>
<h2>取消旧导航，要同时阻止旧结果提交</h2>
<p>新导航开始、用户中止等情况，会让相应旧导航的 signal 取消。示例把它与组件生命周期信号组合后传给 fetch，使离开页面或销毁绑定能停止相关请求。</p>
<p>取得 JSON 以后还检查一次信号和操作序号，是为了防止“请求已经完成，但结果即将提交”这类边界。其他加载器若不支持 AbortSignal，仍需要版本检查，不能只调用 abort 就认定所有异步函数都停止了。</p>
<p>取消是正常的导航竞争结果，不必给用户显示成服务器错误。真正的数据请求失败则应有与目标地址一致的错误界面、重试和日志，而不是留下看起来成功的旧页面内容。</p>
<h2>committed 和 finished 表示不同阶段</h2>
<p><code>navigation.navigate()</code> 等方法返回的对象包含 committed 与 finished 两个 Promise。前者关注导航条目的提交，后者关注这次导航处理的完成，两者可能在不同时间完成或失败。</p>
<p>普通 intercept 的 handler 运行时，currentEntry 已经更新，因此 URL 可能先变成新地址，数据稍后才到达。handler 失败并不等于浏览器自动把应用 DOM 和历史状态都回滚成旧页面；示例因此主动显示目标页面的加载错误。</p>
<p>程序化导航要处理相应 Promise 的拒绝，可以按需求分别观察或使用 Promise.allSettled；也可以监听 navigatesuccess、navigateerror 统一反映状态。不要只把“地址栏变了”当成内容加载成功。</p>
<p>较新的 precommitHandler 可以参与提交之前的处理，但它有自己的可取消条件与兼容要求，不能因为核心 Navigation API 可用，就认定所有扩展选项都一致可用。</p>
<h2>历史、焦点和滚动也有对应模型</h2>
<p>currentEntry 表示当前条目，entries() 可以查看应用可见范围内的条目，条目的 key 可用于相应历史遍历，getState()/updateCurrentEntry() 等能力用于管理关联状态。这不是读取用户全部跨站浏览历史的接口。</p>
<p>条目状态也不等于 URL 中可分享的数据，保存筛选或编辑状态时应区分刷新、链接分享与历史恢复的需求，并使用允许序列化的值。</p>
<p>拦截导航具有默认的焦点与滚动处理，例如完成后处理 autofocus/body 焦点，或恢复历史位置、滚动到片段。选择 manual 会关闭对应默认行为，此时应用要自己承担焦点与滚动的可访问性工作，不能只为了避免滚动就把它永久关闭。</p>
<p>导航 transition 表示条目之间的异步过程，并不自动等于 CSS 动画或 View Transitions 视觉过渡。加载数据、管理历史和播放动画是可以协作但不相同的几层功能。</p>
<p>Navigation API 能减少手动拼接的路由基础工作，但数据缓存、权限、页面错误、组件生命周期和部署深链接仍要由应用设计。选择它或框架封装，应依据目标浏览器与实际路由复杂度，而不只是接口是否新。</p>`};export{e as default};