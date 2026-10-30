var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>订单有待支付、待发货、已发货、已完成、已取消几种状态。如果在每个按钮的点击事件里写 <code>if (status === &#x27;待支付&#x27; || status === &#x27;待发货&#x27;)</code> 来判断能不能取消，规则就散在各处，加一个状态要改很多地方。状态模式的做法是把规则集中起来：每个状态写清楚自己能响应哪些操作、操作后变成哪个状态，不在表里的操作一律拒绝。</p>
<p>命令模式解决的是另一件事：把“一次操作”变成一个对象。这个对象既知道怎样执行，也知道怎样撤销。编辑器每做一次修改，就把对应的命令放进撤销栈；撤销时从栈顶取出命令调用 <code>undo</code>，再放进重做栈；重做时反过来。</p>
<p>两者经常一起出现，但关注点不同。状态模式关心“现在处于什么状态，允许做什么”；命令模式关心“做过哪些操作，怎样回退和重放”。</p>
<p>撤销重做有两个细节要注意。一是在撤销以后又执行了新操作，重做栈要清空，因为历史已经分叉了。二是除了命令，也可以每次保存整份状态快照，Redux 文档里的撤销方案就是用 <code>past</code>、<code>present</code>、<code>future</code> 三段保存状态，实现更简单，但状态很大时占内存。</p>
</blockquote>
<h2>用状态模式管理订单流程</h2>
<p>下面把订单的所有规则写成一张表：第一层是当前状态，第二层是这个状态下允许的操作和目标状态。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 状态模式：每个状态只声明自己能响应哪些事件，以及去往哪个状态</span>
<span class="hljs-keyword">const</span> orderStates = {
  待支付: { 支付: <span class="hljs-string">&#x27;待发货&#x27;</span>, 取消: <span class="hljs-string">&#x27;已取消&#x27;</span> },
  待发货: { 发货: <span class="hljs-string">&#x27;已发货&#x27;</span>, 退款: <span class="hljs-string">&#x27;已取消&#x27;</span> },
  已发货: { 签收: <span class="hljs-string">&#x27;已完成&#x27;</span> },
  已完成: {},
  已取消: {},
};

<span class="hljs-keyword">function</span> <span class="hljs-title function_">transition</span>(<span class="hljs-params">state, event</span>) {
  <span class="hljs-keyword">const</span> next = orderStates[state][event];
  <span class="hljs-keyword">if</span> (!next) <span class="hljs-keyword">return</span> { state, <span class="hljs-attr">error</span>: <span class="hljs-string">\`<span class="hljs-subst">\${state}</span>状态不能<span class="hljs-subst">\${event}</span>\`</span> };
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">state</span>: next };
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">transition</span>(<span class="hljs-string">&#x27;待支付&#x27;</span>, <span class="hljs-string">&#x27;支付&#x27;</span>).<span class="hljs-property">state</span>);  <span class="hljs-comment">// 待发货</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">transition</span>(<span class="hljs-string">&#x27;已发货&#x27;</span>, <span class="hljs-string">&#x27;退款&#x27;</span>).<span class="hljs-property">error</span>);  <span class="hljs-comment">// 已发货状态不能退款</span>
</code></pre></div>
<p>为什么要这样写？因为“已发货的订单能不能退款”这个问题，现在只需要看表里的一行就能回答。页面上哪些按钮可用，也可以直接从 <code>Object.keys(orderStates[state])</code> 得出，按钮显示和实际规则不会对不上。</p>
<p>经典的状态模式会给每个状态写一个类，各自实现同样的方法。在 JavaScript 里，用对象表来描述状态转换更常见，也更容易一眼看全。状态更复杂、需要嵌套或并行时，可以用 XState 这类状态机库。前端里更常见的是请求的加载、成功、失败状态，见<a href="/questions/arch-state-machine/">《怎样避免加载、成功和失败状态互相矛盾？》</a>。</p>
<h2>用命令模式实现撤销重做</h2>
<p>每次插入文字都生成一个命令对象，它记住插入了什么，所以知道怎样撤销。编辑器维护两个栈：撤销栈和重做栈。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 命令模式：把每次修改封装成带 execute 和 undo 的对象，历史记录就是命令列表</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">createEditor</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">let</span> text = <span class="hljs-string">&#x27;&#x27;</span>;
  <span class="hljs-keyword">const</span> undoStack = [];
  <span class="hljs-keyword">const</span> redoStack = [];

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">insert</span>(<span class="hljs-params">value</span>) {
    <span class="hljs-keyword">return</span> {
      <span class="hljs-title function_">execute</span>(<span class="hljs-params"></span>) { text += value; },
      <span class="hljs-title function_">undo</span>(<span class="hljs-params"></span>) { text = text.<span class="hljs-title function_">slice</span>(<span class="hljs-number">0</span>, text.<span class="hljs-property">length</span> - value.<span class="hljs-property">length</span>); },
    };
  }

  <span class="hljs-keyword">return</span> {
    <span class="hljs-title function_">run</span>(<span class="hljs-params">command</span>) {
      command.<span class="hljs-title function_">execute</span>();
      undoStack.<span class="hljs-title function_">push</span>(command);
      redoStack.<span class="hljs-property">length</span> = <span class="hljs-number">0</span>; <span class="hljs-comment">// 执行新操作后，原来的重做分支作废</span>
    },
    <span class="hljs-title function_">undo</span>(<span class="hljs-params"></span>) {
      <span class="hljs-keyword">const</span> command = undoStack.<span class="hljs-title function_">pop</span>();
      <span class="hljs-keyword">if</span> (!command) <span class="hljs-keyword">return</span>;
      command.<span class="hljs-title function_">undo</span>();
      redoStack.<span class="hljs-title function_">push</span>(command);
    },
    <span class="hljs-title function_">redo</span>(<span class="hljs-params"></span>) {
      <span class="hljs-keyword">const</span> command = redoStack.<span class="hljs-title function_">pop</span>();
      <span class="hljs-keyword">if</span> (!command) <span class="hljs-keyword">return</span>;
      command.<span class="hljs-title function_">execute</span>();
      undoStack.<span class="hljs-title function_">push</span>(command);
    },
    insert,
    <span class="hljs-attr">read</span>: <span class="hljs-function">() =&gt;</span> text,
  };
}

<span class="hljs-keyword">const</span> editor = <span class="hljs-title function_">createEditor</span>();
editor.<span class="hljs-title function_">run</span>(editor.<span class="hljs-title function_">insert</span>(<span class="hljs-string">&#x27;你好&#x27;</span>));
editor.<span class="hljs-title function_">run</span>(editor.<span class="hljs-title function_">insert</span>(<span class="hljs-string">&#x27;，世界&#x27;</span>));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(editor.<span class="hljs-title function_">read</span>()); <span class="hljs-comment">// 你好，世界</span>

editor.<span class="hljs-title function_">undo</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(editor.<span class="hljs-title function_">read</span>()); <span class="hljs-comment">// 你好</span>

editor.<span class="hljs-title function_">redo</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(editor.<span class="hljs-title function_">read</span>()); <span class="hljs-comment">// 你好，世界</span>

editor.<span class="hljs-title function_">undo</span>();
editor.<span class="hljs-title function_">run</span>(editor.<span class="hljs-title function_">insert</span>(<span class="hljs-string">&#x27;！&#x27;</span>));
editor.<span class="hljs-title function_">redo</span>(); <span class="hljs-comment">// 新操作已经清空了重做栈，这里什么也不做</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(editor.<span class="hljs-title function_">read</span>()); <span class="hljs-comment">// 你好！</span>
</code></pre></div>
<p>前三次输出好理解：执行两次插入，撤销一次回到“你好”，重做一次又回来。</p>
<p>最后一段是容易出错的地方。撤销“，世界”以后，它进了重做栈；接着插入“！”，这是一次新操作，历史从这里分叉了。如果不清空重做栈，再重做就会在“你好！”后面接上“，世界”，得到一个用户从来没写过的结果。所以 <code>run</code> 里要清空重做栈，最后的 <code>redo</code> 什么也不做。</p>
<h2>命令和快照怎样选</h2>
<p>另一种做法是不记录操作，而是每次修改后保存一份完整的状态。Redux 文档的撤销方案就是这样：状态分成 <code>past</code>、<code>present</code>、<code>future</code> 三段，撤销时把 <code>present</code> 放进 <code>future</code> 开头、从 <code>past</code> 末尾取出一份作为新的 <code>present</code>；执行新操作时把旧的 <code>present</code> 推进 <code>past</code>，并清空 <code>future</code>，和上面清空重做栈是一个道理。</p>
<p>快照的好处是简单，不用为每种操作写撤销逻辑，不容易出错。代价是每一步都要保存一份状态，表单、配置面板这类小状态没问题；画板、长文档这类大状态，就更适合用命令只记录变化。</p>
<p>另外，撤销栈要设上限，比如只保留最近 100 步，否则长时间编辑会一直占用内存。连续输入的文字可以合并成一条命令，不然用户撤销时只会一个字一个字地退。</p>
<h2>常见追问</h2>
<p><strong>命令模式除了撤销重做还能做什么？</strong></p>
<blockquote>
<p>因为操作被封装成了对象，就可以存起来、排队、重放。比如把用户操作记录下来用于回放复现问题；离线时把修改命令排进队列，联网后依次发送；快捷键、菜单和按钮触发同一个命令对象，逻辑只写一份。</p>
</blockquote>
<p><strong>状态模式和策略模式看起来很像，区别是什么？</strong></p>
<blockquote>
<p>两者都是把不同的行为放进不同的对象或表项里。策略模式由调用方决定用哪种策略，策略之间互不知道；状态模式里，状态之间会互相切换，当前状态决定下一个状态是什么，调用方只管发出操作。</p>
</blockquote>`};export{e as default};