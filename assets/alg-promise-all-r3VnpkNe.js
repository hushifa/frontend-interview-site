var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Promise.all 返回一个新 Promise，结果数组按输入顺序排列。</li>
<li>用 Promise.resolve 包装每一项，用计数器统计完成数量，全部完成时 resolve。</li>
<li>任何一项拒绝就立即 reject，其余任务不会被取消。</li>
<li>输入为空时立即用空数组 resolve，输入可以是任意可迭代对象。</li>
</ul>
<p>三个请求按 A、B、C 的顺序传入，B 最先完成，最终结果仍应是 <code>[A的结果, B的结果, C的结果]</code>。Promise.all 聚合的是一组结果，返回顺序由输入位置决定，不由完成速度决定。</p>
<p>因此核心不是在每个回调里 push，而是先给每项分配位置，再把结果写回那个位置，同时记录还有多少项没有完成。</p>
<h2>一份保留核心语义的实现</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">promiseAll</span>(<span class="hljs-params">iterable</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> results = [];
    <span class="hljs-keyword">let</span> remaining = <span class="hljs-number">1</span>;
    <span class="hljs-keyword">let</span> index = <span class="hljs-number">0</span>;

    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> item <span class="hljs-keyword">of</span> iterable) {
      <span class="hljs-keyword">const</span> position = index++;
      remaining++;

      <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>(item).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> {
        results[position] = value;
        <span class="hljs-keyword">if</span> (--remaining === <span class="hljs-number">0</span>) <span class="hljs-title function_">resolve</span>(results);
      }, reject);
    }

    <span class="hljs-keyword">if</span> (--remaining === <span class="hljs-number">0</span>) <span class="hljs-title function_">resolve</span>(results);
  });
}
</code></pre></div>
<p>这个版本使用正常的内建 Promise 处理普通值、Promise 和 thenable，接收同步可迭代对象。它用于理解聚合顺序和拒绝传播，不是完整替代原生静态方法的 polyfill；构造器泛型、子类、内建方法被改写等规范细节不在此实现范围内。</p>
<h2>position 必须在登记这项输入时固定</h2>
<p>循环中的 position 是当前输入的索引，每次迭代都有自己的词法绑定。即使第二项先完成，也只写 results[1]，不会抢占 results[0]。</p>
<p>可以不依赖计时器，用手动兑现把完成顺序反过来：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> finishFirst;
<span class="hljs-keyword">let</span> finishSecond;

<span class="hljs-keyword">const</span> first = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> { finishFirst = resolve; });
<span class="hljs-keyword">const</span> second = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> { finishSecond = resolve; });
<span class="hljs-keyword">const</span> combined = <span class="hljs-title function_">promiseAll</span>([first, second, <span class="hljs-number">42</span>]);

<span class="hljs-title function_">finishSecond</span>(<span class="hljs-string">&#x27;B&#x27;</span>);
<span class="hljs-title function_">finishFirst</span>(<span class="hljs-string">&#x27;A&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">await</span> combined);
</code></pre></div>
<p>在支持顶层 await 的模块或控制台环境中，结果是 <code>[&#x27;A&#x27;, &#x27;B&#x27;, 42]</code>。换成完成时直接 push，就会失去这种输入与输出的对应关系。</p>
<h2>remaining 为什么从 1 开始</h2>
<p>可以把初始的 1 理解为“还在登记输入”的占位。每登记一项加一，每项成功后减一，遍历结束再减掉那个占位。最终归零时，说明输入已登记完，而且所有项都成功。</p>
<p>空输入不会进入循环，遍历结束把 1 减成 0，直接兑现空数组。这个占位让空输入与普通输入沿同一套计数规则处理，不用写一个返回不同类型的特殊分支。</p>
<p>但 Promise 已兑现不代表 then 同步执行。空输入的结果可以已经是 fulfilled，后续 then 回调仍按 Promise 微任务规则运行；非空输入即使全是普通值，也要经过登记的异步完成回调。</p>
<h2>为什么不直接调用 item.then</h2>
<p>输入可能是数字、字符串或普通对象，它们没有 then。Promise.resolve 把它们统一接入 Promise 处理，并按照 Promise 的解析规则采用 thenable 的最终结果。</p>
<p>这也避免直接信任一个自定义 thenable：它可能多次调用 resolve，或者先 resolve 再 reject。正常 Promise 解析只采用首次有效结果，不会让同一项随意把 remaining 减多次。</p>
<p>如果读取 then 属性时抛错，解析会拒绝，聚合也会失败。不要自己只判断 <code>typeof item.then === &#x27;function&#x27;</code>，就认为已经完整实现 thenable 同化与异常语义。</p>
<h2>输入不只可以是数组，但遍历是同步的</h2>
<p>Set、生成器和字符串等同步 iterable 都可以被 for...of 遍历。数组中的空位通过迭代得到 undefined，也会占据结果中的一个位置。</p>
<p>null 或普通不可迭代对象会使遍历抛错。由于遍历运行在 Promise 构造器的执行函数中，错误会转成返回 Promise 的拒绝；生成器中途抛错也会导致拒绝，不能当成“已经遍历的前几项部分成功”返回。</p>
<p>这个接口不接收仅有异步迭代协议的对象，也不会等一个无限生成器慢慢完成。遍历本身是同步工作，输入非常大或迭代器永不结束时，仍可能阻塞当前线程。</p>
<h2>“快速失败”并不等于取消其余任务</h2>
<p>任意一项的拒绝被观察到后，整体 Promise 会拒绝，之后其他项成功也不会把整体改回成功。多个失败同时竞争时，采用的是最先让整体拒绝的原因，不保证是输入索引最小的那一项。</p>
<p>但是已经发出的请求、计时器和其他副作用仍可继续。即使整体已拒绝，其他项仍有登记好的处理器；Promise.all 并不会因此自动调用 AbortController，也不会回滚服务器已经完成的写入。</p>
<p>还要注意同步登记与异步失败的区别：一个已经拒绝的 Promise 放在第一项，通常不会让这段 for...of 当场停止登记后续输入，因为拒绝处理器要等微任务执行。不要把“聚合结果快速拒绝”解释成“发现第一项失败后绝不会创建后面的工作”。</p>
<p>需要等待每一项的成功或失败结果，应考虑 allSettled 或明确的带状态结果；需要取消底层工作，则要在任务层另外设计，且处理取消后可能仍在服务器发生的操作。</p>
<h2>Promise.all 不替你启动函数，也不限制并发</h2>
<p>把函数本身传进去，它会被当作普通值，不会自动执行。许多示例看起来“Promise.all 发起了请求”，其实是构造输入数组时已经调用了 fetch。</p>
<p>同样，只有两个 Promise 参数，并不代表只有两个后台请求；每个任务内部可能启动更多工作。限制并发时应接收尚未启动的任务函数，再由并发池控制何时调用。</p>
<p>如果构造输入数组的某个函数同步抛错，甚至可能还没调用到 Promise.all 就失败了。调用者需要理解错误发生在参数求值阶段，还是已经进入 Promise 聚合，不要只在一个不存在的返回 Promise 上寻找 catch。</p>
<p>对于 n 项，登记与保存结果需要 O(n) 级别的辅助工作和结果空间，但这个复杂度不包含输入任务本身的网络、计算或 thenable 自定义行为。生产代码优先使用原生 Promise.all，手写的价值在于把这些契约解释清楚。</p>`};export{e as default};