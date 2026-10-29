var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>实时协同编辑，就是几个人同时改同一份文档，每个人都能马上看到别人的修改。设计时要先分清四层：传输层，比如 WebSocket；操作，比如插入、删除；文档状态；还有光标、在线成员这类临时状态。</p>
<p>冲突怎么解决，有三种思路。第一种是版本检查，提交时带上版本号，冲突了就拒绝，让用户自己合并。第二种是 OT，服务端按顺序接收操作，把并发的操作调整位置后再广播。第三种是 CRDT，用特殊的数据结构，保证各端不管按什么顺序合并，最后都一致。</p>
<p>体验上，本地编辑要立刻生效，再同步给别人，不能让网络延迟影响打字。光标、选区这些临时状态不用持久化，丢了重新同步就行，不要和文档内容走同一套冲突解决。</p>
<p>还要注意，权限仍然要由服务端校验每一个操作，断线重连以后也要能把漏掉的操作补齐。</p>
</blockquote>
<h2>并发编辑为什么会冲突</h2>
<p>看一个最简单的例子。文档内容是 <code>ab</code>，A 在位置 1 插入 <code>x</code>，B 同时在位置 2 插入 <code>y</code>。</p>
<p>如果双方直接按位置应用对方的操作，A 这边先得到 <code>axb</code>，再应用“位置 2 插入 y”，得到 <code>axyb</code>。B 那边先得到 <code>aby</code>，再应用“位置 1 插入 x”，得到 <code>axby</code>。两边的结果不一样了。</p>
<p>问题出在位置上。A 插入 <code>x</code> 以后，B 原来说的“位置 2”在 A 这边已经变成了位置 3。</p>
<p>OT 的做法是在应用对方操作之前，把位置 2 调整成 3。CRDT 的做法是不用数字位置，而是给每个字符一个唯一 ID，插入时说“插在某个 ID 后面”，这样无论先后，定位都不会错。</p>
<h2>三种方式怎么选</h2>
<table><thead><tr><th>方式</th><th>原理</th><th>适用场景</th></tr></thead><tbody><tr><td>版本检查</td><td>提交时带上基础版本号，不一致则拒绝</td><td>表单、配置这类低频编辑</td></tr><tr><td>OT</td><td>服务端按顺序接收操作，变换并发操作的位置再广播</td><td>Google Docs 等中心化文本编辑</td></tr><tr><td>CRDT</td><td>每个字符有唯一 ID 和顺序信息，任意顺序合并都得到相同结果</td><td>去中心化、离线优先、点对点</td></tr></tbody></table>
<h2>用现成的 CRDT 库</h2>
<p>自己实现 OT 或 CRDT，正确性很难保证，一般直接用 Yjs、Automerge 这类成熟的库。下面是 Yjs 的用法：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> * <span class="hljs-keyword">as</span> Y <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;yjs&#x27;</span>;
<span class="hljs-keyword">import</span> { <span class="hljs-title class_">WebsocketProvider</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;y-websocket&#x27;</span>;

<span class="hljs-keyword">const</span> doc = <span class="hljs-keyword">new</span> Y.<span class="hljs-title class_">Doc</span>();
<span class="hljs-keyword">const</span> provider = <span class="hljs-keyword">new</span> <span class="hljs-title class_">WebsocketProvider</span>(<span class="hljs-string">&#x27;wss://collab.example.com&#x27;</span>, <span class="hljs-string">&#x27;doc-123&#x27;</span>, doc);
<span class="hljs-keyword">const</span> text = doc.<span class="hljs-title function_">getText</span>(<span class="hljs-string">&#x27;content&#x27;</span>);

text.<span class="hljs-title function_">observe</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">render</span>(text.<span class="hljs-title function_">toString</span>()));
text.<span class="hljs-title function_">insert</span>(<span class="hljs-number">0</span>, <span class="hljs-string">&#x27;你好&#x27;</span>);

provider.<span class="hljs-property">awareness</span>.<span class="hljs-title function_">setLocalStateField</span>(<span class="hljs-string">&#x27;cursor&#x27;</span>, { <span class="hljs-attr">index</span>: <span class="hljs-number">2</span> });
</code></pre></div>
<p><code>Y.Doc</code> 在本地维护一份文档副本。<code>text.insert</code> 的修改立刻生效，同时把增量更新发给服务器和其他客户端。别人的修改到了，<code>observe</code> 回调触发，重新渲染。</p>
<p>光标用的是 <code>awareness</code>，它和文档内容分开传输。成员长时间没有更新，就会被自动移除。这正是前面说的：临时状态和文档内容分开处理。</p>
<h2>离线和重连怎么办</h2>
<p>CRDT 的一个好处是离线时可以继续编辑，重连以后交换彼此缺的更新，自动合并。</p>
<p>本地还没被确认的更新，要存进 IndexedDB，防止页面关掉以后丢失。</p>
<p>不过要注意，长时间离线后自动合并的结果，在数据上是一致的，语义上却可能不合理，比如两个人改写了同一段话。所以还要提供历史版本和恢复能力。</p>
<h2>服务端负责什么</h2>
<p>鉴权方面，连接时验证用户能不能访问这份文档，每个更新也要检查有没有写权限，只读用户发来的更新直接拒绝。</p>
<p>持久化方面，定期保存文档快照，同时保留更新日志，用来恢复。</p>
<p>资源方面，CRDT 会保留已删除内容的元信息，文档体积会随着编辑历史一直增长，需要定期压缩或做垃圾回收。</p>
<h2>常见追问</h2>
<p><strong>用 WebSocket 还是 WebRTC？</strong></p>
<blockquote>
<p>WebSocket 经过服务器，方便鉴权和持久化。WebRTC 是点对点的，延迟低，但仍然需要信令服务器来建立连接，权限也更难控制。</p>
</blockquote>
<p><strong>撤销怎么处理？</strong></p>
<blockquote>
<p>协同场景下，撤销只撤销自己的操作。Yjs 的 <code>UndoManager</code> 会按来源记录操作，不会把别人的修改撤掉。</p>
</blockquote>`};export{e as default};