var e={answerHtml:`<h2>简答</h2>
<ul>
<li>协同编辑要分清四层：传输（WebSocket 等）、操作（插入、删除）、文档状态和临时状态（光标、在线成员）。</li>
<li>冲突解决有三种思路：乐观锁版本检查（冲突时拒绝并让用户合并）、OT（服务端变换并发操作）和 CRDT（数据结构保证各端最终一致）。</li>
<li>本地编辑立即生效再同步给他人，网络延迟不能影响输入体验。</li>
<li>光标、选区等临时状态不需要持久化，丢失可以重新同步，不应和文档内容走同一套冲突解决。</li>
<li>权限仍由服务端校验每个操作，断线重连后要能补齐缺失的操作。</li>
</ul>
<h2>三种冲突处理方式</h2>
<table><thead><tr><th>方式</th><th>原理</th><th>适用场景</th></tr></thead><tbody><tr><td>版本检查</td><td>提交时带上基础版本号，不一致则拒绝</td><td>表单、配置这类低频编辑</td></tr><tr><td>OT</td><td>服务端按顺序接收操作，变换并发操作的位置再广播</td><td>Google Docs 等中心化文本编辑</td></tr><tr><td>CRDT</td><td>每个字符有唯一 ID 和顺序信息，任意顺序合并都得到相同结果</td><td>去中心化、离线优先、点对点</td></tr></tbody></table>
<p><strong>并发插入示例</strong>：文档是 <code>ab</code>，A 在位置 1 插入 <code>x</code>，B 同时在位置 2 插入 <code>y</code>。直接按位置应用时，A 端先得到 <code>axb</code>，再应用&quot;位置 2 插入 y&quot;得到 <code>axyb</code>；B 端先得到 <code>aby</code>，再应用&quot;位置 1 插入 x&quot;得到 <code>axby</code>。两端结果不一致。OT 在应用对方操作前把位置 2 调整为 3；CRDT 用元素 ID 而不是数字位置定位插入点。</p>
<h2>用 CRDT 库实现</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> * <span class="hljs-keyword">as</span> Y <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;yjs&#x27;</span>;
<span class="hljs-keyword">import</span> { <span class="hljs-title class_">WebsocketProvider</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;y-websocket&#x27;</span>;

<span class="hljs-keyword">const</span> doc = <span class="hljs-keyword">new</span> Y.<span class="hljs-title class_">Doc</span>();
<span class="hljs-keyword">const</span> provider = <span class="hljs-keyword">new</span> <span class="hljs-title class_">WebsocketProvider</span>(<span class="hljs-string">&#x27;wss://collab.example.com&#x27;</span>, <span class="hljs-string">&#x27;doc-123&#x27;</span>, doc);
<span class="hljs-keyword">const</span> text = doc.<span class="hljs-title function_">getText</span>(<span class="hljs-string">&#x27;content&#x27;</span>);

text.<span class="hljs-title function_">observe</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">render</span>(text.<span class="hljs-title function_">toString</span>()));
text.<span class="hljs-title function_">insert</span>(<span class="hljs-number">0</span>, <span class="hljs-string">&#x27;你好&#x27;</span>);

provider.<span class="hljs-property">awareness</span>.<span class="hljs-title function_">setLocalStateField</span>(<span class="hljs-string">&#x27;cursor&#x27;</span>, { <span class="hljs-attr">index</span>: <span class="hljs-number">2</span> });
</code></pre></div>
<ul>
<li><code>Y.Doc</code> 维护本地副本，修改立即生效，并把增量更新发给服务器和其他客户端。</li>
<li><code>awareness</code> 单独传输光标和在线状态，超时未更新的成员自动移除。</li>
<li>自己实现 OT 或 CRDT 的正确性很难保证，通常使用 Yjs、Automerge 等成熟库。</li>
</ul>
<h2>离线与重连</h2>
<ul>
<li>CRDT 可以在离线时继续编辑，重连后交换缺失的更新自动合并。</li>
<li>本地把未确认的更新存入 IndexedDB，防止页面关闭后丢失。</li>
<li>长时间离线后合并结果可能在语义上不合理（两人改写了同一段），需要提供历史版本和恢复能力。</li>
</ul>
<h2>服务端的职责</h2>
<ul>
<li>鉴权：连接时验证用户是否能访问该文档，每个更新也要检查是否有写权限，只读用户的更新直接拒绝。</li>
<li>持久化：定期保存文档快照，并保留更新日志用于恢复。</li>
<li>资源：CRDT 会保留删除的元信息，文档体积随编辑历史增长，需要定期压缩或做垃圾回收。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>用 WebSocket 还是 WebRTC？WebSocket 经过服务器，便于鉴权和持久化；WebRTC 点对点延迟低，但仍需要信令服务器，权限控制更难。</li>
<li>撤销怎么处理？协同场景下只撤销自己的操作，Yjs 的 <code>UndoManager</code> 按来源记录操作，不会撤销别人的修改。</li>
</ul>`};export{e as default};