var e={answerHtml:`<p>用户提交搜索后，焦点仍在输入框里，旁边的结果数量从 0 变成 8。能看见页面的人容易察觉变化，读屏用户却不一定会自动听到它，也不应该每次更新都被强制移动焦点到结果区。</p>
<p>Live region 用来把这种动态变化暴露给辅助技术，使合适的信息可以在不移动焦点的情况下被通知。它不是语音播放 API，浏览器和读屏如何排队、合并和朗读，仍有实现与用户设置差异。</p>
<h2>先选择通知的重要程度</h2>
<table><thead><tr><th>设置</th><th>常见用途</th></tr></thead><tbody><tr><td><code>aria-live=&quot;polite&quot;</code></td><td>等待合适时机通知，适合搜索结果、保存状态等普通反馈</td></tr><tr><td><code>aria-live=&quot;assertive&quot;</code></td><td>更高优先级，可能打断当前朗读，只适合确实紧急的信息</td></tr><tr><td><code>role=&quot;status&quot;</code></td><td>具有状态通知语义，隐含 polite 和 atomic=true</td></tr><tr><td><code>role=&quot;alert&quot;</code></td><td>具有警报语义，隐含较强的通知优先级，不用于所有普通提示</td></tr></tbody></table>
<p>多数“已保存”“找到若干结果”不需要 assertive。把所有变化都设成紧急通知，会不断打断用户，反而让真正重要的信息难以理解。</p>
<p>role=status 本身已提供相应 live 语义，不必为了保险再堆上多个相同区域。role=alert 与重复的 aria-live 配置在部分组合中还可能产生重复通知。需要冗余属性时应有实际兼容性依据，而不是越多越好。</p>
<p>aria-live=off 也不能简单理解成“这块内容对读屏永远静音”，用户把焦点或阅读位置移到其中时，仍可能按正常阅读规则感知内容。</p>
<h2>通知区域最好先存在，再更新文字</h2>
<p>辅助技术通常需要先知道“这里是一个 live region”，才能观察后续变化。可靠的基础做法是在初始 HTML 中保留一个空区域：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;search-status&quot;</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;status&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">ul</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;search-results&quot;</span> <span class="hljs-attr">aria-busy</span>=<span class="hljs-string">&quot;false&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">ul</span>&gt;</span>
</code></pre></div>
<p>之后再更新 search-status 的 textContent。不要在同一瞬间创建一个普通节点、写入文字、加上 aria-live，就假定所有组合都必然播报。</p>
<p>如果必须动态建立区域，应让区域有机会先被暴露，再在后续任务中更新内容，但具体效果仍要测试。role=alert 常有特殊处理，有时初始或新插入的警报内容也会被通知；不能把这种特殊情况推广到所有 polite 区域。</p>
<p>区域也不能一直 display:none、hidden 或被 aria-hidden 隐藏，还期待其中的变化正常通知。只想视觉隐藏时，应使用经过验证的 visually-hidden 样式，保留它在可访问性树中的存在。</p>
<h2>搜索状态还需要防止旧请求覆盖新消息</h2>
<p>下面的辅助函数不发请求，只管理一个明确的状态区域和结果容器。每次真正开始一轮搜索时调用 start，获得对应的 complete/fail；旧搜索结束时不会覆盖新搜索的状态。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createSearchStatus</span>(<span class="hljs-params">status, results</span>) {
  <span class="hljs-keyword">let</span> latest = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> disposed = <span class="hljs-literal">false</span>;

  <span class="hljs-keyword">return</span> {
    <span class="hljs-title function_">start</span>(<span class="hljs-params">query</span>) {
      <span class="hljs-keyword">if</span> (disposed) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;搜索状态已销毁&#x27;</span>);
      <span class="hljs-keyword">const</span> id = ++latest;
      <span class="hljs-keyword">const</span> term = query.<span class="hljs-title function_">trim</span>();
      results.<span class="hljs-title function_">setAttribute</span>(<span class="hljs-string">&#x27;aria-busy&#x27;</span>, <span class="hljs-string">&#x27;true&#x27;</span>);
      status.<span class="hljs-property">textContent</span> = term ? <span class="hljs-string">\`正在搜索“<span class="hljs-subst">\${term}</span>”。\`</span> : <span class="hljs-string">&#x27;正在更新搜索结果。&#x27;</span>;

      <span class="hljs-keyword">return</span> {
        <span class="hljs-title function_">complete</span>(<span class="hljs-params">count</span>) {
          <span class="hljs-keyword">if</span> (disposed || id !== latest) <span class="hljs-keyword">return</span>;
          <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isSafeInteger</span>(count) || count &lt; <span class="hljs-number">0</span>) {
            <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;结果数量必须是非负整数&#x27;</span>);
          }
          results.<span class="hljs-title function_">setAttribute</span>(<span class="hljs-string">&#x27;aria-busy&#x27;</span>, <span class="hljs-string">&#x27;false&#x27;</span>);
          status.<span class="hljs-property">textContent</span> = term
            ? <span class="hljs-string">\`“<span class="hljs-subst">\${term}</span>”找到 <span class="hljs-subst">\${count}</span> 个结果。\`</span>
            : <span class="hljs-string">\`找到 <span class="hljs-subst">\${count}</span> 个结果。\`</span>;
        },
        <span class="hljs-title function_">fail</span>(<span class="hljs-params"></span>) {
          <span class="hljs-keyword">if</span> (disposed || id !== latest) <span class="hljs-keyword">return</span>;
          results.<span class="hljs-title function_">setAttribute</span>(<span class="hljs-string">&#x27;aria-busy&#x27;</span>, <span class="hljs-string">&#x27;false&#x27;</span>);
          status.<span class="hljs-property">textContent</span> = <span class="hljs-string">&#x27;搜索失败，请重试。&#x27;</span>;
        },
      };
    },
    <span class="hljs-title function_">dispose</span>(<span class="hljs-params"></span>) {
      disposed = <span class="hljs-literal">true</span>;
      latest += <span class="hljs-number">1</span>;
      results.<span class="hljs-title function_">setAttribute</span>(<span class="hljs-string">&#x27;aria-busy&#x27;</span>, <span class="hljs-string">&#x27;false&#x27;</span>);
      status.<span class="hljs-property">textContent</span> = <span class="hljs-string">&#x27;&#x27;</span>;
    },
  };
}
</code></pre></div>
<p>完成时应先把对应结果更新到界面，再调用 complete，让状态与用户可阅读的内容一致。这个函数只保护状态消息，数据加载和结果列表本身也要处理取消与过期结果，不能以为通知没串就代表数据也没串。</p>
<p>示例使用 textContent，不把搜索词当 HTML 执行。status 保留在结果列表之外，所以清空或重建结果列表时不会把通知区域也销毁；焦点仍由原来的交互逻辑管理。</p>
<p>不要把这段接口直接接到每一个按键上不断通知“正在搜索”。可以按实际提交或适当防抖后的请求阶段更新，查询词较长时也应考虑简洁的反馈文案。</p>
<h2>atomic、relevant 和 busy 控制的是不同方面</h2>
<p>aria-atomic 决定区域局部变化时，辅助技术是否把整个区域作为一次完整信息呈现。例如“找到 8 个结果”只改变数字时，读出完整短句通常比只读“8”清楚。status 已隐含 atomic=true。</p>
<p>aria-relevant 用来表达哪些变化值得通知，例如新增或文本变化。它不是“用户一定按这个顺序听到所有记录”的队列协议，不应把频繁变动的长列表直接配置为全量紧急播报。</p>
<p>aria-busy 表示区域正在更新，可帮助辅助技术等待更完整的状态。若把 busy 长期留为 true，可能导致通知迟迟不发生。示例把 busy 放在结果列表上，而把需要即时提供的简短状态放在独立区域，避免把“正在搜索”的提示也一起压住。</p>
<h2>重复文本和快速更新并不总会逐条播报</h2>
<p>连续把同一句“已保存”写进去，可能没有新的有效文本变化，也可能被读屏合并。几个快速更新也未必被逐字逐条读出。</p>
<p>应让业务阶段和消息上下文明确，例如从“保存中”变为“已保存”，而不是靠不停追加空格、清空重写或制造随机字符来强迫朗读。需要重复操作的反馈时，应在目标辅助技术上验证节奏与内容，不宣称某个固定延时对所有组合都有效。</p>
<p>聊天消息、实时日志和 AI 流式文本尤其要避免每个 token 都作为高优先级通知。可以按合适批次或完整消息通知，并让用户控制阅读，不要把整份不断增长的正文塞进 assertive 区域。</p>
<h2>通知不能代替名称、错误关联或必要的焦点管理</h2>
<p>一次播报结束后，用户仍应能在界面中找到相关结果或错误。字段错误需要与字段关联，保存失败需要可操作的重试路径，不能只瞬间显示一句话然后永远消失。</p>
<p>普通状态不需要把焦点抢到提示上；真正打开一个必须操作的对话框时，也不能只靠 live region 通知而不处理焦点。它们解决的是不同任务。</p>
<p>验证可以先检查可访问性树是否暴露了 status、live、atomic 等信息，再用真实读屏测试首次更新、连续搜索、相同结果、失败、清空和页面切换。属性存在与实际听到什么不是同一项证据，自动化不能替代最终的读屏体验确认。</p>`};export{e as default};