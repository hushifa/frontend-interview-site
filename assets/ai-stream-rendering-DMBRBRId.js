var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>AI 回答是一小段一小段流过来的，一秒可能来几十次。如果每来一段就更新一次状态、把整条消息的 Markdown 重新解析一遍、再滚动到底部，回答越长每次要做的事越多，页面就越来越卡。</p>
<p>改法有三步。第一，收到的增量先放进缓冲区，用 <code>requestAnimationFrame</code> 每帧最多合并更新一次，因为屏幕一帧只画一次，更新得再多也看不出来。第二，把消息按段落拆开，已经写完的段落缓存解析结果，每次只重新解析最后那段还在增长的。第三，长对话里只让正在生成的那条消息更新，历史消息不跟着重新渲染。</p>
<p>自动贴底要尊重用户。用户停在底部时，新内容出来就跟着往下滚；用户往上翻看历史时，就暂停贴底，显示一个“回到底部”的按钮。判断是否在底部，可以在滚动时算 <code>scrollHeight - clientHeight - scrollTop</code> 是否接近 0，也可以在列表末尾放一个哨兵元素，用 <code>IntersectionObserver</code> 看它是否可见。</p>
<p>还要注意浏览器的滚动锚定。内容在视口外变化时，浏览器默认会调整滚动位置，让用户正在看的内容不动。它在加载更早的历史消息时很有用，可它会额外改变滚动位置，和自己写的滚动逻辑冲突时，可以用 <code>overflow-anchor: none</code> 把相关区域排除掉。</p>
</blockquote>
<h2>为什么每来一段就渲染会越来越卡</h2>
<p>一个流式回答可能有几百上千个增量。假设每个增量都触发一次 React 状态更新，组件就会重新渲染几百次；如果渲染时把整条消息交给 Markdown 解析器，第 500 次更新要解析的是前 500 段拼起来的全文。所以总的工作量不是随长度线性增长，而是越往后每一次都更贵。</p>
<p>屏幕的刷新是按帧来的，一帧里改十次和改一次，用户看到的是同一个画面。所以没有必要每个增量都更新界面，只要每帧把这期间攒下的文字一次写进去就够了。</p>
<h2>怎样按帧合并更新</h2>
<p>思路是收到增量时只往缓冲区里追加，第一次追加时预约一个“下一帧刷新”，刷新时把缓冲区的内容一次性交出去。下面把调度函数做成参数，示例里手动触发“下一帧”，看合并的效果：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createFrameBatcher</span>(<span class="hljs-params">flush, schedule</span>) {
  <span class="hljs-keyword">let</span> buffer = <span class="hljs-string">&#x27;&#x27;</span>;
  <span class="hljs-keyword">let</span> scheduled = <span class="hljs-literal">false</span>;

  <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">push</span>(<span class="hljs-params">chunk</span>) {
    buffer += chunk;
    <span class="hljs-keyword">if</span> (scheduled) <span class="hljs-keyword">return</span>;
    scheduled = <span class="hljs-literal">true</span>;
    <span class="hljs-title function_">schedule</span>(<span class="hljs-function">() =&gt;</span> {
      scheduled = <span class="hljs-literal">false</span>;
      <span class="hljs-keyword">const</span> text = buffer;
      buffer = <span class="hljs-string">&#x27;&#x27;</span>;
      <span class="hljs-title function_">flush</span>(text);
    });
  };
}

<span class="hljs-keyword">const</span> frames = [];
<span class="hljs-keyword">const</span> flushed = [];
<span class="hljs-keyword">const</span> push = <span class="hljs-title function_">createFrameBatcher</span>(
  <span class="hljs-function">(<span class="hljs-params">text</span>) =&gt;</span> flushed.<span class="hljs-title function_">push</span>(text),
  <span class="hljs-function">(<span class="hljs-params">callback</span>) =&gt;</span> frames.<span class="hljs-title function_">push</span>(callback),
);

<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;你&#x27;</span>);
<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;好&#x27;</span>);
<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;，&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(frames.<span class="hljs-property">length</span>); <span class="hljs-comment">// 1</span>
frames.<span class="hljs-title function_">shift</span>()();
<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;世界&#x27;</span>);
frames.<span class="hljs-title function_">shift</span>()();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(flushed.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;|&#x27;</span>)); <span class="hljs-comment">// 你好，|世界</span>
</code></pre></div>
<p>前三个增量只预约了一次刷新，所以 <code>frames.length</code> 是 1。这一帧执行时，三段文字合在一起交给 <code>flush</code>，界面只更新一次。之后再来的“世界”会预约新的一帧，所以最后 <code>flush</code> 被调用了两次。</p>
<p>在浏览器里，<code>schedule</code> 传 <code>requestAnimationFrame</code> 就行，<code>flush</code> 里做状态更新。按 MDN 的说明，<code>requestAnimationFrame</code> 的回调在下一次重绘之前执行，大多数浏览器在后台标签页里会暂停它，所以页面不可见时也不会白白刷新。要注意请求结束时缓冲区里可能还有没刷出去的文字，结束事件到来时要立刻刷一次，不要等下一帧。</p>
<h2>已经完成的段落为什么不用重新解析</h2>
<p>合并以后每帧最多解析一次，可每次解析的仍然是越来越长的全文。其实前面的段落早就写完了，不会再变，只有最后一段还在增长。</p>
<p>所以可以按空行把消息切成段落块，每个块用它的文本内容作为缓存的键。已经完成的块，文本没变，就直接用上次的解析结果；只有最后一块每帧重新解析。在 React 里，可以把每个块渲染成一个用 <code>memo</code> 包起来的组件，<code>props</code> 是这一块的文本，文本没变的块就跳过重新渲染。</p>
<p>切块时要注意代码块。代码块里面也可能有空行，如果按空行硬切，一个代码块会被拆成两半，各自解析出来的结果都不对。所以切分前要先识别 <code>\`\`\`</code> 围起来的范围，代码块内部的空行不算段落边界。没闭合的代码块、半个链接这类不完整的内容怎样安全显示，见<a href="/questions/ai-markdown-security/">《AI 生成的 Markdown 应该怎样安全地渲染？》</a>。</p>
<h2>自动滚到底部怎样判断用户在不在底部</h2>
<p>自动贴底的规则很简单：用户在底部，就跟着新内容滚；用户不在底部，就别动。难点是判断“在底部”。</p>
<p>一种办法是在滚动事件里计算。<code>scrollTop</code> 是已经滚过去的高度，<code>clientHeight</code> 是可见区域的高度，<code>scrollHeight</code> 是全部内容的高度，三者满足 <code>scrollHeight - clientHeight - scrollTop</code> 接近 0 时就是到底了。MDN 特别说明 <code>scrollTop</code> 可能带小数，而另外两个是整数，所以不能用严格相等，要允许一点误差。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> container = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;.messages&#x27;</span>);
<span class="hljs-keyword">let</span> stickToBottom = <span class="hljs-literal">true</span>;

container.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;scroll&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">const</span> distance = container.<span class="hljs-property">scrollHeight</span> - container.<span class="hljs-property">clientHeight</span> - container.<span class="hljs-property">scrollTop</span>;
  <span class="hljs-comment">// 留出几十像素的余量，用户离底部很近时仍然算在底部。</span>
  stickToBottom = distance &lt; <span class="hljs-number">40</span>;
  jumpButton.<span class="hljs-property">hidden</span> = stickToBottom;
});

<span class="hljs-keyword">function</span> <span class="hljs-title function_">onContentUpdated</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">if</span> (stickToBottom) container.<span class="hljs-property">scrollTop</span> = container.<span class="hljs-property">scrollHeight</span>;
}
</code></pre></div>
<p>另一种办法是在消息列表最后放一个空的哨兵元素，用 <code>IntersectionObserver</code> 观察它。哨兵可见，说明用户在底部；不可见，说明用户往上翻了。它不用在每次滚动时计算，<code>root</code> 设为消息容器，<code>rootMargin</code> 可以把判断范围往外放一点，作用和上面的余量一样。</p>
<p><code>onContentUpdated</code> 要放在合并后的那次刷新里调用，不要每个增量都滚一次。贴底还要考虑读屏器用户，哪些内容该播报、焦点怎么处理，见<a href="/questions/ai-chat-state/">《AI 聊天界面为什么不能只有 loading 一个状态？》</a>。</p>
<h2>overflow-anchor 解决什么问题</h2>
<p>浏览器有一个默认开启的功能叫滚动锚定：当视口外面的内容发生变化，比如上方插入了新元素，浏览器会自动调整滚动位置，让用户正在看的那部分内容停在原地。</p>
<p>这在聊天里有好有坏。好处是往上翻加载更早的历史消息时，新消息插在顶部，用户看的位置不会被推走。坏处是它会额外改变滚动位置，MDN 提到，页面和滚动锚定配合不好，多半是因为某个 <code>scroll</code> 监听没有处理这次额外的滚动。上面的 <code>scroll</code> 监听就可能被它触发，误判用户离开了底部。</p>
<p>遇到这种冲突时，可以用 <code>overflow-anchor: none</code> 把某个元素排除在锚点候选之外。这个属性不继承，可 MDN 的指南说明，一个区域被排除以后，里面的子元素也不能再重新加入，所以通常设在消息容器上：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.messages</span> {
  <span class="hljs-attribute">overflow-anchor</span>: none;
}
</code></pre></div>
<p>MDN 把 <code>overflow-anchor</code> 标为 Baseline 2026 新近可用，较老的浏览器版本可能不支持，所以贴底逻辑不能依赖它，它只用来排除干扰。</p>
<h2>常见追问</h2>
<p><strong>为什么不直接用 <code>scrollIntoView</code> 滚到最后一条消息？</strong></p>
<blockquote>
<p>可以用，效果一样。关键不在用哪个 API，而在什么时候调用：只在用户本来就在底部时滚，并且每帧最多滚一次。如果每个增量都调用一次，还带着平滑滚动，动画会互相打断，页面看起来一直在抖。</p>
</blockquote>
<p><strong>对话很长、有几百条消息时怎么办？</strong></p>
<blockquote>
<p>先保证只有正在生成的那条消息在频繁更新，历史消息的组件用 <code>memo</code> 跳过重新渲染。消息多到 DOM 本身成了负担时，再考虑虚拟列表。聊天的消息高度不固定，而且是从底部往上看，测量高度和保持滚动位置都更麻烦，见<a href="/questions/performance-virtual-list/">《动态高度的虚拟列表怎样处理测量、滚动锚点和焦点？》</a>。</p>
</blockquote>
<p><strong>流式数据是怎么一段段拿到的？</strong></p>
<blockquote>
<p>渲染只是最后一步。前面要从响应流里读出字节、解码成文本、按协议切出完整的事件，再按消息 ID 把文字增量追加到对应的消息上，见<a href="/questions/ai-stream-protocol/">《AI 流式响应为什么不能每收到一块就 JSON.parse？》</a>。</p>
</blockquote>`};export{e as default};