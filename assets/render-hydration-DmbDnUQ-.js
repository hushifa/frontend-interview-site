var e={answerHtml:`<h2>简答</h2>
<p>Hydration 是客户端在服务端生成的 HTML 上挂载事件并复用 DOM 的过程，要求客户端首次渲染与服务端 HTML 完全一致。常见的不一致原因：渲染中使用了 Date.now() 或 Math.random()、依赖浏览器才有的 API（window、localStorage）、时区或语言不同、HTML 嵌套不合法（如 div 放在 p 里）、浏览器扩展修改了 DOM。修复方法是让首次渲染使用同一份数据，只在客户端运行的内容放到挂载后（useEffect、onMounted）再更新。</p>
<p>服务端已经生成了一棵 HTML，客户端 React 需要把组件逻辑连接到这些现有节点上，这个过程就是 hydration。它希望客户端第一次渲染所描述的结构和内容，与浏览器实际拿到的服务端 DOM 对应。</p>
<p>如果服务器输出“未登录”，客户端第一次就渲染“欢迎回来”，或者双方生成了不同的随机 ID，React 便无法把两份结果无歧义地对应起来。它可能报告不一致、进行恢复或重新渲染内容，额外开销只是问题的一部分。</p>
<h2>比较的是客户端首次渲染，不是页面永远不许变化</h2>
<p>可以分清三个阶段：</p>
<ol>
<li>服务器生成 HTML 与初始数据快照。</li>
<li>浏览器解析 HTML，客户端使用同一份初始输入进行 hydration。</li>
<li>接管完成后，用户操作、Effect 或新数据触发正常更新。</li>
</ol>
<p>第三阶段显示不同内容很正常。问题在于第二阶段已经与现有 DOM 不一致，不能把这种差异当成一次普通更新处理。</p>
<p>React 不保证会把所有不一致属性自动修好，因此“不报致命错误，页面大致能看”不是修复标准。</p>
<h2>先检查四类常见原因</h2>
<table><thead><tr><th>原因</th><th>例子</th><th>优先修复方向</th></tr></thead><tbody><tr><td>初始数据不同</td><td>服务器与客户端分别请求到不同版本</td><td>传递并复用对应数据快照</td></tr><tr><td>环境或时间不同</td><td>时区、语言、Date.now、随机值</td><td>固定初始表示，随后再增强</td></tr><tr><td>HTML 结构无效</td><td>p 内嵌入不允许的块级结构</td><td>修正结构，检查浏览器解析后的 DOM</td></tr><tr><td>接管前 DOM 被改动</td><td>第三方脚本、扩展或插入逻辑修改节点</td><td>找到修改来源，明确 DOM 所有权</td></tr></tbody></table>
<p>只比较服务端源码字符串还不够。不合法 HTML 可能已经被浏览器解析器修正，真正 hydration 的对象是修正后的 DOM。</p>
<p>例如 <code>&lt;p&gt;说明&lt;div&gt;地址&lt;/div&gt;&lt;/p&gt;</code> 会让解析器提前结束 p，而不会得到组件预期的嵌套关系；表格省略 tbody 时也可能由解析器补入节点。应修复组件结构，并同时比较网络响应原文、Elements 中的实际 DOM 和客户端组件树，而不是只看截图或抑制警告。</p>
<h2>时间显示可以先一致，再本地化</h2>
<p>如果服务器按 UTC 格式化、浏览器按本地时区格式化，即使双方拿的是同一时间点，第一次显示也可能不同。可以让初始输出统一使用传入的 ISO 字符串，接管后再显示用户本地时间：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useEffect, useState } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">PublishedTime</span>(<span class="hljs-params">{ iso }</span>) {
  <span class="hljs-keyword">const</span> [showLocal, setShowLocal] = <span class="hljs-title function_">useState</span>(<span class="hljs-literal">false</span>);

  <span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-title function_">setShowLocal</span>(<span class="hljs-literal">true</span>);
  }, []);

  <span class="hljs-keyword">const</span> label = showLocal
    ? <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DateTimeFormat</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>, {
        <span class="hljs-attr">dateStyle</span>: <span class="hljs-string">&#x27;medium&#x27;</span>,
        <span class="hljs-attr">timeStyle</span>: <span class="hljs-string">&#x27;short&#x27;</span>,
      }).<span class="hljs-title function_">format</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(iso))
    : iso;

  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">time</span> <span class="hljs-attr">dateTime</span>=<span class="hljs-string">{iso}</span>&gt;</span>{label}<span class="hljs-tag">&lt;/<span class="hljs-name">time</span>&gt;</span></span>;
}
</code></pre></div>
<p>iso 应是已经验证的时间字符串，服务端与客户端必须收到同一值。服务端不运行 Effect，客户端首次也从 false 开始，因此都先输出 iso；随后浏览器中的 Effect 触发本地化更新。</p>
<p>这种两次渲染会有额外成本和可能的文字变化，适合确实需要客户端环境的信息，不应把整站内容都先隐藏到 Effect 之后。若业务要求首屏就是固定时区文案，也可以在两端使用同样的语言和明确的 timeZone，而不必做第二次切换。</p>
<h2>typeof window 不会自动保证一致</h2>
<p>在 render 中写“有 window 就返回 A，没有就返回 B”，只能避免服务端访问某个浏览器对象，并没有解决两端首次 HTML 不同的问题。</p>
<p>读取 localStorage、视口宽度或客户端权限状态时，也要决定初始表示。可以由服务端提供一致的初始偏好、用 CSS 处理纯布局差异，或在接管后更新只属于浏览器的信息。</p>
<p>需要真正仅客户端运行的功能时，可以使用当前框架支持的客户端边界，但应限定到必要区域。不要为了一个浏览器专属组件，让整页正文失去原本可用的服务端 HTML。</p>
<h2>ID、数据与多根节点也需要一致</h2>
<p>随机 ID 不适合在两端各生成一次再期待匹配。React 的 useId 可以帮助生成与渲染树相关的稳定标识，但仍需要树结构与环境配置一致，多根节点使用的 identifierPrefix 也应对应。</p>
<p>DOM id 和 aria-describedby 是真实 HTML 属性，列表 key 则是框架协调身份的提示，React 不把它作为普通 DOM 属性输出。修改 key 不能修复浏览器已经解析出的错误结构。可变列表应使用稳定记录 ID；下标在重排时可能错误复用状态，但静态列表使用下标不必然产生 hydration 警告。首次结构匹配与后续状态身份维护应分别检查。</p>
<p>初始状态序列化时要保护用户边界，并使用正确的 HTML 转义方式。把 JSON.stringify 的结果直接拼入任意 script 上下文，不自动保证安全；也不能为了“让状态一致”把服务端秘密一并发给客户端。</p>
<p>若登录状态或数据版本在缓存中混用了，根因可能是缓存策略，而不是组件需要增加更多客户端判断。</p>
<h2>suppressHydrationWarning 只适合有限例外</h2>
<p>它是针对可解释差异的逃生口，不会让任意子树都安全匹配，也不是深层统一修复开关。使用前应明确哪些差异无法避免、实际 DOM 最终会是什么，以及是否影响交互或可访问性。</p>
<p>大面积增加该属性会把真正的数据与结构问题藏起来。使用 createRoot 重新覆盖已有服务端节点，或过早调用 root.render 让整棵树改走客户端渲染，也只是改变处理路径，不等于已经理解了不一致原因。</p>
<h2>排查时保存首轮证据</h2>
<p>记录问题页面的初始响应、传给客户端的数据，以及第三方脚本修改前后的 DOM；结合开发环境提示、组件栈和 onRecoverableError 定位具体区域。</p>
<p>然后分别验证直达、刷新、不同语言与时区、缓存命中和登录状态。一次客户端路由切换正常，并不能证明完整文档首次 hydration 也正确。修复应让首轮输入和结构有清楚来源，接管后的差异则作为正常更新处理。</p>`};export{e as default};