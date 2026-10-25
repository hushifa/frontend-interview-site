var e={answerHtml:`<p>三个布尔值 loading、success、error 可以表达很多组合，但“同时正在首次加载、已经成功、又失败”未必是业务允许的界面。代码每多一条更新路径，就要记得同步清理其他标志，遗漏后容易出现错误提示和成功结果一起显示。</p>
<p>可以先列出这个流程真实允许的状态，再定义哪些事件能改变它。简单的一次性加载可能只有 idle、loading、success、error；状态机的价值在于约束转换，不在于必须安装某个库。</p>
<h2>先把每个状态需要的数据放在一起</h2>
<p>idle 不需要结果，loading 需要知道当前是哪次请求，success 携带数据，error 携带错误说明。这样读取成功数据前先判断 status，就不必猜 data、loading 和 error 三个独立字段是否已经同步。</p>
<p>在 TypeScript 中可以用可辨识联合进一步表达这些约束；在 JavaScript 中，也可以保持相同的对象结构，并在数据入口做必要校验。</p>
<p>按钮是否禁用、是否显示重试，通常可以由当前状态推导。若再各自保存一份布尔值，就重新引入了不同步的机会。</p>
<h2>只在合法状态接收对应结果</h2>
<p>下面是一个请求状态转换函数。事件由应用内部产生，requestId 用于标识当前尝试；新的 start 可以取代旧请求，旧结果不再有资格更新界面。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">reduceRequest</span>(<span class="hljs-params">state, event</span>) {
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;start&#x27;</span>) {
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;loading&#x27;</span>, <span class="hljs-attr">requestId</span>: event.<span class="hljs-property">requestId</span> };
  }

  <span class="hljs-keyword">if</span> (state.<span class="hljs-property">status</span> !== <span class="hljs-string">&#x27;loading&#x27;</span> || event.<span class="hljs-property">requestId</span> !== state.<span class="hljs-property">requestId</span>) {
    <span class="hljs-keyword">return</span> state;
  }

  <span class="hljs-keyword">switch</span> (event.<span class="hljs-property">type</span>) {
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;succeed&#x27;</span>:
      <span class="hljs-keyword">return</span> { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;success&#x27;</span>, <span class="hljs-attr">data</span>: event.<span class="hljs-property">data</span> };
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;fail&#x27;</span>:
      <span class="hljs-keyword">return</span> { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;error&#x27;</span>, <span class="hljs-attr">message</span>: event.<span class="hljs-property">message</span> };
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;cancel&#x27;</span>:
      <span class="hljs-keyword">return</span> { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;idle&#x27;</span> };
    <span class="hljs-attr">default</span>:
      <span class="hljs-keyword">return</span> state;
  }
}
</code></pre></div>
<p>它只计算下一个状态，不发请求、不读取时钟，也不创建计时器。调用方从 <code>{ status: &#x27;idle&#x27; }</code> 开始，把经过校验的内部事件传入，并保存返回的状态。</p>
<p>假设依次发生 start(1)、start(2)、succeed(1)、succeed(2)：第三个事件不会把第二次请求的 loading 覆盖掉，最后才展示第二次请求的数据。已经成功后重复收到完成事件，也不会再次改变状态。</p>
<p>这里的 start 代表应用明确接受的新操作，不是把任意外部消息直接当成新请求。请求编号应由发起层可靠生成；如果输入来自消息通道，还需要协议与重复事件检查。</p>
<h2>可以用转换表检查遗漏</h2>
<table><thead><tr><th>当前情况</th><th>事件</th><th>示例的处理</th></tr></thead><tbody><tr><td>任意已有状态</td><td>新的 start</td><td>进入新请求的 loading</td></tr><tr><td>loading</td><td>当前请求 succeed</td><td>进入 success</td></tr><tr><td>loading</td><td>当前请求 fail</td><td>进入 error</td></tr><tr><td>loading</td><td>当前请求 cancel</td><td>回到 idle</td></tr><tr><td>loading</td><td>旧请求完成</td><td>保持当前状态</td></tr><tr><td>非 loading</td><td>重复完成或取消</td><td>保持当前状态</td></tr></tbody></table>
<p>表里的规则是本例的选择，不是所有产品的统一答案。比如取消后是否回到 idle、保留旧结果，还是显示 canceled，应该根据实际流程决定。</p>
<p>重要的是这些决定集中且可测试，而不是散在多个 catch、finally 和组件 effect 中，各自修改一部分布尔值。</p>
<h2>“有数据，同时正在刷新”可能完全合法</h2>
<p>不是所有看起来并存的状态都是矛盾。用户已经看到列表，后台刷新正在进行，这时 data 存在且 fetching 为 true 很合理；刷新失败也可能继续展示旧数据并附加错误提示。</p>
<p>可以把“是否已有可用数据”与“刷新任务状态”分成真正独立的维度，或建立嵌套状态，例如 ready 状态内部再有 idle、refreshing、refreshError。</p>
<p>不要为了只有一个 status 字段，就每次刷新都清空旧内容；也不要为了支持后台刷新，让首次加载的模型出现任意组合。状态结构应表达产品允许的情形。</p>
<h2>状态转换不能替代取消和清理</h2>
<p>把状态改成 idle，并不会自动终止 fetch。上面的 requestId 检查能防止旧结果进入当前 UI，但旧请求仍可能占用网络或在服务器产生副作用。</p>
<p>发起层还应管理 AbortController、计时器和资源释放。finally 中也要判断是否仍属于当前请求，避免旧请求结束时把新请求的加载状态清掉。</p>
<p>对于支付、提交等写操作，前端显示 canceled 不等于服务器已经撤销。需要依照业务协议查询最终状态或处理幂等，不能只靠 UI 状态机保证服务端一致性。</p>
<h2>什么时候需要更完整的状态机工具</h2>
<p>单个请求用这样的 reducer 往往足够。多步审批、并行上传、超时恢复和嵌套弹层等流程，如果事件与分支越来越多，可以使用显式状态图或成熟状态机工具表达进入动作、守卫条件和并行区域。</p>
<p>工具不会替你决定业务规则。先说明事件的含义、允许的转换、过期事件的处理和失败后的下一步，再选择实现方式，通常比先引入库后把原来的布尔值全部搬进去更有效。</p>`};export{e as default};