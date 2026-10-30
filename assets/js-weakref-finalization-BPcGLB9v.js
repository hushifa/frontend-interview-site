var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>做图片缓存时，希望内存紧张的时候缓存里的大对象能被回收，而不是因为缓存一直引用着就永远留着。<code>WeakRef</code> 就是为这种需求准备的：它引用一个对象，但不阻止这个对象被垃圾回收，需要时用 <code>deref()</code> 取出来，对象已经被回收就得到 <code>undefined</code>。</p>
<p><code>FinalizationRegistry</code> 是配套的：把对象注册进去，对象被回收后，引擎可能会调用你给的清理回调，回调收到的是注册时给的“持有值”，比如缓存的键，可以用来删掉 Map 里已经失效的条目。</p>
<p>关键限制是不确定性。垃圾回收什么时候发生、会不会发生，都由引擎决定，<code>deref()</code> 可能一直不返回 <code>undefined</code>，清理回调也可能永远不执行。所以 MDN 说正确使用它们需要仔细考虑，能不用就不用，清理回调不能承担必需的程序逻辑。</p>
<p>MDN 举的典型用途是按 URL 缓存大对象的缓存系统。清理回调主要用来减少内存占用，比如删掉缓存里失效的条目；关闭连接、移除监听这类必须做的释放，仍然要在代码里显式完成。</p>
</blockquote>
<h2>基本用法</h2>
<p>下面的例子能确定输出的只有“取回对象”和“取消注册”这部分，回收本身不能用代码触发。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> target = { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;大对象&#x27;</span> };
<span class="hljs-keyword">const</span> ref = <span class="hljs-keyword">new</span> <span class="hljs-title class_">WeakRef</span>(target);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(ref.<span class="hljs-title function_">deref</span>() === target); <span class="hljs-comment">// true</span>
<span class="hljs-keyword">const</span> registry = <span class="hljs-keyword">new</span> <span class="hljs-title class_">FinalizationRegistry</span>(<span class="hljs-function">(<span class="hljs-params">heldValue</span>) =&gt;</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;已回收&#x27;</span>, heldValue);
});
<span class="hljs-keyword">const</span> token = {};
registry.<span class="hljs-title function_">register</span>(target, <span class="hljs-string">&#x27;cache-key&#x27;</span>, token);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(registry.<span class="hljs-title function_">unregister</span>(token)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(registry.<span class="hljs-title function_">unregister</span>(token)); <span class="hljs-comment">// false</span>
</code></pre></div>
<p>为什么例子里没有演示“回收之后 <code>deref()</code> 返回 <code>undefined</code>”？因为即使把 <code>target = null</code>，什么时候回收也由引擎决定，可能马上，也可能一直不发生，写不出一个稳定的输出。MDN 还规定，刚创建 <code>WeakRef</code> 或刚通过 <code>deref()</code> 拿到对象后，这个对象在当前任务结束前不会被回收，所以同一段同步代码里多次 <code>deref()</code> 结果是一致的，不会一次拿到对象一次拿到 <code>undefined</code>。</p>
<p><code>register</code> 的第三个参数是取消注册用的令牌。资源已经被主动释放时，调用 <code>unregister(token)</code> 取消回调，成功返回 <code>true</code>，再调一次就没有可取消的了，返回 <code>false</code>。注册表对令牌和目标对象都只是弱引用。持有值如果是对象，注册表会强引用它，所以持有值里不能再引用目标对象，否则目标永远不会被回收；直接把目标本身当持有值传入，<code>register</code> 会抛 <code>TypeError</code>。</p>
<h2>写一个可回收的缓存</h2>
<p>典型写法是用 <code>Map</code> 存 <code>key → WeakRef</code>。读缓存时先 <code>deref()</code>，拿到对象就用，拿到 <code>undefined</code> 就重新加载。再用 <code>FinalizationRegistry</code> 在对象回收后删掉对应的键，避免 Map 里堆满空的 <code>WeakRef</code>。删之前要再检查一次这个键当前存的 <code>WeakRef</code> 是否已经失效，因为同一个键可能已经放进了新对象。</p>
<p>这和 <code>WeakMap</code> 的用途不一样。<code>WeakMap</code> 是“对象作键”，对象没了条目自动消失，适合给对象附加数据；<code>WeakRef</code> 是“对象作值”，适合按字符串等键缓存对象。两者的对比见<a href="/questions/js-map-set-weak/">《Map、Set、WeakMap 与普通对象各有什么用途？》</a>，内存回收的基本原理见<a href="/questions/js-garbage-collection/">《垃圾回收为什么无法自动解决所有内存泄漏？》</a>。</p>
<h2>为什么不推荐依赖它们</h2>
<p>MDN 解释，规范刻意不保证回收行为，是为了不让垃圾回收的细节暴露给代码。否则大家会写依赖某个引擎回收时机的代码，引擎一改就坏了。不同引擎、同一引擎的不同版本、甚至同一页面在不同内存压力下，结果都可能不同。</p>
<p>MDN 还列出了通常不会调用回调的情况：程序整体退出（比如关闭标签页），或者 <code>FinalizationRegistry</code> 实例本身已经无法访问。所以清理回调只能做“做了更好，不做也不出错”的事，MDN 的原话是它可能有助于减少内存占用，此外不太有用。真正必须释放的资源，比如关闭连接、移除监听，要在业务流程里显式调用释放方法。</p>
<h2>常见追问</h2>
<p><strong>清理回调里还能用 deref 拿到对象吗？</strong></p>
<blockquote>
<p>不能。MDN 说明，如果一个对象同时被 <code>WeakRef</code> 引用并注册在 <code>FinalizationRegistry</code> 里，<code>WeakRef</code> 的目标会在清理回调调用之前或同时被清空，回调里再 <code>deref()</code> 只能得到 <code>undefined</code>。回调里能用的只有注册时传的持有值。</p>
</blockquote>
<p><strong>能用它们检测内存泄漏吗？</strong></p>
<blockquote>
<p>只能做粗略的辅助观察，不能作为结论。回调不执行不代表对象泄漏了，可能只是引擎还没回收。排查泄漏应该用 DevTools 的堆快照，看是谁还在引用对象。</p>
</blockquote>`};export{e as default};