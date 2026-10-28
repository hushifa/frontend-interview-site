var e={answerHtml:`<h2>简答</h2>
<ul>
<li>输入法组合期间（compositionstart 到 compositionend）不应提交搜索查询。</li>
<li>组合开始时让旧请求失效，组合结束后再按最终值防抖搜索。</li>
<li>每次请求要带身份标识，只接受最新请求的结果，避免竞态覆盖。</li>
<li>Enter 在组合期间可能用于确认候选词；要用真实输入法和设备测试。</li>
</ul>
<p>用户输入拼音准备选择“前端”，搜索框却在每个中间音节都请求接口，甚至返回结果后重置输入框，导致候选词丢失。输入法组合阶段的文本是编辑过程的一部分，不一定是用户确认的最终查询。</p>
<p>compositionstart 表示开始组合，compositionend 表示结束；InputEvent.isComposing 可以说明 input 事件是否处于组合阶段。不能只监听 keyup，因为粘贴、语音输入、移动键盘和输入法不一定与物理按键一一对应。</p>
<h2>保留输入，不在组合期间提交查询</h2>
<p>下面的函数接收已有 input 和 render 回调。render 负责用安全的文本或组件展示结果；搜索端点约定为同源 <code>/api/search?q=...</code>，返回 JSON。它展示的是输入与请求生命周期，不实现完整搜索建议的键盘选择模式。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">bindImeSearch</span>(<span class="hljs-params">input, render</span>) {
  <span class="hljs-keyword">let</span> composing = <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">let</span> timer;
  <span class="hljs-keyword">let</span> request;
  <span class="hljs-keyword">let</span> revision = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> disposed = <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">let</span> lastScheduled = <span class="hljs-literal">null</span>;

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">invalidate</span>(<span class="hljs-params"></span>) {
    <span class="hljs-built_in">clearTimeout</span>(timer);
    request?.<span class="hljs-title function_">abort</span>();
    revision += <span class="hljs-number">1</span>;
  }

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">schedule</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">if</span> (disposed || composing) <span class="hljs-keyword">return</span>;
    <span class="hljs-keyword">const</span> query = input.<span class="hljs-property">value</span>.<span class="hljs-title function_">trim</span>();
    <span class="hljs-comment">// compositionend 后可能紧接相同最终值的 input，避免重复安排。</span>
    <span class="hljs-keyword">if</span> (query === lastScheduled) <span class="hljs-keyword">return</span>;
    lastScheduled = query;
    <span class="hljs-title function_">invalidate</span>();
    <span class="hljs-keyword">const</span> current = revision;
    <span class="hljs-keyword">if</span> (!query) {
      <span class="hljs-title function_">render</span>({ <span class="hljs-attr">state</span>: <span class="hljs-string">&#x27;empty&#x27;</span>, <span class="hljs-attr">items</span>: [] });
      <span class="hljs-keyword">return</span>;
    }
    timer = <span class="hljs-built_in">setTimeout</span>(<span class="hljs-title function_">async</span> () =&gt; {
      <span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
      request = controller;
      <span class="hljs-keyword">try</span> {
        <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/api/search?&#x27;</span> + <span class="hljs-keyword">new</span> <span class="hljs-title class_">URLSearchParams</span>({ <span class="hljs-attr">q</span>: query }), {
          <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span>,
        });
        <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`搜索失败：HTTP <span class="hljs-subst">\${response.status}</span>\`</span>);
        <span class="hljs-keyword">const</span> data = <span class="hljs-keyword">await</span> response.<span class="hljs-title function_">json</span>();
        <span class="hljs-keyword">if</span> (!disposed &amp;&amp; current === revision) <span class="hljs-title function_">render</span>({ <span class="hljs-attr">state</span>: <span class="hljs-string">&#x27;ready&#x27;</span>, <span class="hljs-attr">items</span>: data });
      } <span class="hljs-keyword">catch</span> (error) {
        <span class="hljs-keyword">if</span> (!disposed &amp;&amp; current === revision &amp;&amp; !controller.<span class="hljs-property">signal</span>.<span class="hljs-property">aborted</span>) {
          lastScheduled = <span class="hljs-literal">null</span>;
          <span class="hljs-title function_">render</span>({ <span class="hljs-attr">state</span>: <span class="hljs-string">&#x27;error&#x27;</span> });
        }
      }
    }, <span class="hljs-number">200</span>);
  }

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">onStart</span>(<span class="hljs-params"></span>) {
    composing = <span class="hljs-literal">true</span>;
    lastScheduled = <span class="hljs-literal">null</span>;
    <span class="hljs-title function_">invalidate</span>();
  }
  <span class="hljs-keyword">function</span> <span class="hljs-title function_">onEnd</span>(<span class="hljs-params"></span>) {
    composing = <span class="hljs-literal">false</span>;
    <span class="hljs-title function_">schedule</span>();
  }
  <span class="hljs-keyword">function</span> <span class="hljs-title function_">onInput</span>(<span class="hljs-params">event</span>) {
    <span class="hljs-keyword">if</span> (!event.<span class="hljs-property">isComposing</span> &amp;&amp; !composing) <span class="hljs-title function_">schedule</span>();
  }
  input.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;compositionstart&#x27;</span>, onStart);
  input.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;compositionend&#x27;</span>, onEnd);
  input.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;input&#x27;</span>, onInput);

  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {
    disposed = <span class="hljs-literal">true</span>;
    <span class="hljs-title function_">invalidate</span>();
    input.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;compositionstart&#x27;</span>, onStart);
    input.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;compositionend&#x27;</span>, onEnd);
    input.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;input&#x27;</span>, onInput);
  };
}
</code></pre></div>
<p>输入框自己的值保持由用户编辑，不在组合期间把它替换成格式化字符串。框架受控输入也要遵守这个边界，不能为了“过滤非法字符”在每次中间输入时重新写值、移动选区或重新挂载节点。</p>
<p>200 毫秒只是教学防抖值，不是输入法协议要求。lastScheduled 用于避免相同查询重复安排；正式 UI 应另提供显式重试按钮，不要求用户改一个字符才能重试。返回 JSON 在实际项目中还应按响应契约校验，不能把未知对象直接当作可渲染列表。</p>
<h2>为什么开始组合就要让旧请求失效</h2>
<p>用户先搜“前”，随后开始新的组合输入。如果旧请求此时返回，不能用旧结果覆盖新输入阶段的界面。invalidate 在组合开始时就增加 revision，并取消已有请求，而不是等到新词确认后才更新身份。</p>
<p>AbortController 减少无用网络工作，revision 则防止已经完成网络传输、仍在解析中的旧结果写回。两者职责不同，不能只保留一个。卸载后还要清理防抖计时器与监听器，避免晚到结果更新已不存在的组件。</p>
<h2>Enter 可能用于确认候选词</h2>
<p>搜索框按 Enter 提交时，必须先确认不在组合输入中。不能在候选词确认过程中既提交表单又结束组合，也不要无条件 preventDefault 阻断输入法操作。KeyboardEvent.isComposing 与内部组合状态可以提供判断，但不同操作系统、输入法和浏览器的最终事件顺序仍需实测。</p>
<p>不要用“出现 keyCode 229 就一定是什么状态”作为唯一长期协议。旧环境的兼容分支可以存在，但需要说明对应目标与回归用例。快捷键、按键提交与 input 查询应分别测试。</p>
<h2>测试哪些真实操作</h2>
<p>纯逻辑测试可人工派发组合事件和 input，验证组合中不请求、最终值只安排一次、旧结果不覆盖、清空与卸载正确。这样的事件是程序模拟，不能证明真实输入法候选窗口、选区与平台顺序正常。</p>
<p>真实设备还应覆盖中文拼音、日文转换、移动键盘、粘贴、撤销、语音输入和 Enter 确认。搜索建议若能选择条目，需要另行实现组合框的键盘与无障碍契约；不应因为输入法处理正确就声称整个搜索控件已无障碍。</p>
<p>搜索参数进入 URL 前使用编码 API，服务端限制长度、频率并校验权限；组合输入处理不是安全过滤器。敏感输入也不应作为分析事件或错误日志原样上报。</p>`};export{e as default};