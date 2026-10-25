var e={answerHtml:`<p>不是同一件事。SSR 主要回答“怎样在服务端生成初始 HTML”；Server Components 则回答“哪些组件可以在与客户端应用分离的环境中执行，它们的代码和依赖是否需要发到浏览器”。</p>
<p>传统 React SSR 可以先生成 HTML，再把相应客户端组件代码发给浏览器进行 hydration。RSC 可以让一部分内容生成和数据处理只在服务端或构建环境中执行，浏览器接收相应结果与客户端组件引用，不必下载这些 Server Component 的实现。</p>
<p>两者可以协作，也可以在不同生成时机使用。不能把“页面用了 SSR”和“项目支持 RSC”当成同一项能力。</p>
<h2>用文章和收藏按钮理解边界</h2>
<p>在支持 RSC 的框架中，可以让文章内容由 Server Component 组织，把需要点击状态的按钮作为 Client Component。假设 article 是服务端数据层已经验证并允许展示的记录：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// Article.jsx：在支持 RSC 的项目中作为 Server Component 使用。</span>
<span class="hljs-keyword">import</span> <span class="hljs-title class_">BookmarkButton</span> <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./BookmarkButton.jsx&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">Article</span>(<span class="hljs-params">{ article }</span>) {
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">article</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">h1</span>&gt;</span>{article.title}<span class="hljs-tag">&lt;/<span class="hljs-name">h1</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>{article.body}<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">BookmarkButton</span> <span class="hljs-attr">key</span>=<span class="hljs-string">{article.id}</span> <span class="hljs-attr">articleId</span>=<span class="hljs-string">{article.id}</span> /&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">article</span>&gt;</span></span>
  );
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-string">&#x27;use client&#x27;</span>;

<span class="hljs-keyword">import</span> { useState } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">BookmarkButton</span>(<span class="hljs-params">{ articleId }</span>) {
  <span class="hljs-keyword">const</span> [saved, setSaved] = <span class="hljs-title function_">useState</span>(<span class="hljs-literal">false</span>);

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">button</span>
      <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span>
      <span class="hljs-attr">data-article-id</span>=<span class="hljs-string">{articleId}</span>
      <span class="hljs-attr">aria-pressed</span>=<span class="hljs-string">{saved}</span>
      <span class="hljs-attr">onClick</span>=<span class="hljs-string">{()</span> =&gt;</span> setSaved((value) =&gt; !value)}
    &gt;
      {saved ? &#x27;取消收藏&#x27; : &#x27;收藏&#x27;}
    <span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>这里的收藏只演示当前页面中的客户端状态，没有持久化或调用服务端。文章 ID 变化时通过 key 区分按钮实例，避免把上一篇文章的局部状态误带到下一篇。</p>
<p>这两段说明组件边界，不是一个仅加文件就能在普通 Vite 应用中自动启用 RSC 的完整项目。需要支持相应构建和传输协议的框架或集成。</p>
<h2>use client 标记的是模块边界</h2>
<p>被 use client 标记的模块及其相关传递依赖进入客户端代码范围。Server Component 可以引用这个边界，但不能把普通交互回调直接当成可跨环境共享的函数传过去。</p>
<p>Client Component 也不等于“只在浏览器执行”。它可能参与初始 HTML 的服务端渲染，再在浏览器 hydration，因此在首次 render 中直接访问 window 等对象，仍可能产生环境问题。</p>
<p>边界也不能只看 JSX 的父子位置。Server Component 可以把已经组织好的内容作为 children 等 props 交给客户端组件组合；客户端父组件没有因此直接导入或执行那些服务器模块。模块依赖关系与渲染组合关系需要分开理解。</p>
<h2>RSC 的结果不只是 HTML 字符串</h2>
<p>RSC 处理会产生供 React 和框架使用的结果，包含可渲染内容、客户端模块引用与相关数据。初次请求时，框架可以进一步生成 HTML；后续导航也可能获取相应组件结果再合并进现有客户端界面，不一定重新下载完整 HTML 文档。</p>
<p>因此 RSC 与 HTML 的 SSR 管线可以同时存在，状态保持、缓存和导航行为由 React 与框架的相应机制共同组织。它不是让开发者自己把一段任意 HTML 字符串当组件注入。</p>
<h2>跨边界数据必须符合 React 的传递规则</h2>
<p>传给客户端的值需要属于 React 与框架支持的可序列化范围。这不等于只能使用 JSON：相应协议还支持 Date、Map、Set 等部分类型，但并非所有类实例、符号和普通闭包都能随意传递。</p>
<p>特殊的 Server Function 引用有专门机制，不能据此推导“任何函数都能作为 props 从服务器传到浏览器”。应按当前文档检查类型边界，而不是依赖 JSON.stringify 是否碰巧成功。</p>
<p>只要数据被输出到 HTML、客户端 props 或传输结果中，就可能被访问者取得。Server Component 的实现不进入客户端包，不等于它读取的所有数据都自动保密；仍需要在数据层限制权限和输出字段。</p>
<h2>Server Component 不一定需要请求时服务器</h2>
<p>它可以在构建阶段读取文件或静态数据，为预生成内容服务；也可以在有运行时服务的环境中按请求访问数据库等资源。</p>
<p>是否需要长期运行的服务器，取决于内容与调用时机。动态身份数据、实时查询和服务器函数执行，不能仅靠静态托管凭空获得运行环境。</p>
<p>能够直接使用服务端能力，也不代表必须把所有数据处理都放进组件。权限、查询、缓存和领域逻辑仍应有可维护的边界。</p>
<h2>RSC、Server Functions 和客户端状态各有用途</h2>
<p>Server Components 用于在相应环境中计算可渲染结果，不能像客户端交互组件一样依赖 useState、DOM 事件或浏览器 Effect。</p>
<p>Server Functions 是另一类可由框架调用的服务器函数能力，use server 用来标记相关函数，不是给所有 Server Component 文件添加的必要标记。执行写操作时仍要验证身份、参数和权限，不能只因为调用来自某个按钮就信任它。</p>
<p>客户端组件继续承担浏览器交互和相应局部状态。合理划分通常让静态内容和重依赖尽量留在服务器侧，同时把需要即时反馈的交互保留在客户端。</p>
<h2>性能收益取决于实际依赖与数据量</h2>
<p>一个很大的格式化库如果只被服务器组件使用，可以减少客户端包负担；但输出大量组件数据、串行等待多个查询或频繁重新请求，也可能造成新的成本。</p>
<p>React 19 中的 Server Components 能力与实现框架、打包器所用的底层接口具有不同稳定性承诺。普通项目优先使用维护中的框架，并按照它的版本要求升级，不要把自建协议集成当成一项只需加 use client 的小配置。</p>`};export{e as default};