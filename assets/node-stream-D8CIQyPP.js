var e={answerHtml:`<h2>简答</h2>
<ul>
<li>流把数据分块处理，内存占用与文件大小无关。</li>
<li>背压由 write() 的返回值和 drain 事件表达，可读流会按需暂停。</li>
<li>用 stream.pipeline 连接各个流，它会传播错误并销毁所有流。</li>
<li>可读流支持 for await...of 消费。</li>
</ul>
<p>假设要压缩一个 10 GB 日志文件。如果先 readFile 读完，再压缩并写出，输入、输出和处理中间数据都可能占据大量内存。流把工作改成逐块读取、逐块处理、逐块写入，不要求一次保存整个文件。</p>
<p>但“分块”还不够。如果磁盘读得快、下游写得慢，读出的块仍可能不断堆积。背压就是让慢的一方反馈“先别继续送”，使整个管道的生产速度与消费能力协调。</p>
<h2>优先用 pipeline 连接处理步骤</h2>
<p>下面是 Node ESM 示例，要求 source.log 已存在；输出文件若已存在则拒绝覆盖：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { createReadStream, createWriteStream } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:fs&#x27;</span>;
<span class="hljs-keyword">import</span> { createGzip } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:zlib&#x27;</span>;
<span class="hljs-keyword">import</span> { pipeline } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:stream/promises&#x27;</span>;

<span class="hljs-keyword">await</span> <span class="hljs-title function_">pipeline</span>(
  <span class="hljs-title function_">createReadStream</span>(<span class="hljs-string">&#x27;source.log&#x27;</span>),
  <span class="hljs-title function_">createGzip</span>(),
  <span class="hljs-title function_">createWriteStream</span>(<span class="hljs-string">&#x27;source.log.gz&#x27;</span>, { <span class="hljs-attr">flags</span>: <span class="hljs-string">&#x27;wx&#x27;</span> }),
);
</code></pre></div>
<p>读取流提供数据，压缩 Transform 消费输入并产生输出，写入流把压缩数据落盘。pipeline 负责连接背压和错误传播；Promise 成功完成，表示管道按流协议完成，而不是刚刚开始写入。</p>
<p>中途某个流失败，pipeline 会按规则销毁管道中的相关流并拒绝 Promise，避免上游还在不停读。但它不会自动撤销已经写出的内容，失败后可能留下部分文件。重要产物可以先写临时路径，成功后再按平台和文件系统语义完成替换，并安排失败清理。</p>
<h2>write 返回 false 不是“这块没写进去”</h2>
<p>对于 Writable，write(chunk) 的返回值是流量提示。返回 false 表示当前缓冲达到阈值，应停止继续写，等待 drain；这一块已经被接收，不应在 drain 后再重复写一次。</p>
<p>如果忽略 false，持续把整个文件的数据塞进去，Node 通常仍会缓冲后续写入，直到内存压力越来越大。也就是说，使用了流 API 却不遵守背压，仍可能得到接近“一次性攒满内存”的效果。</p>
<p>手动实现写循环时，除了 drain 还要处理 error、提前关闭、结束和取消，不能只写一个永远等待 drain 的 Promise。一般任务优先使用 pipeline，减少遗漏的生命周期分支。</p>
<h2>highWaterMark 是阈值，不是进程内存上限</h2>
<p>字节流的 highWaterMark 通常按字节衡量，objectMode 下通常按对象数量衡量。一个对象内部可能包含巨大数组，所以“缓冲 16 个对象”不等于只占很少内存。解码字符串等模式也有自己的计量细节。</p>
<p>Transform 有可读和可写两侧缓冲，压缩器内部、网络栈以及应用自己的缓存也会占内存。单个 chunk 还可能超过阈值。因此把 highWaterMark 设成 64 KiB，并不能保证进程总内存不超过 64 KiB。</p>
<p>调节阈值是在吞吐、延迟和内存之间权衡，不是越小越好。先保持合理默认值，再用真实数据测量。</p>
<h2>数据块不是业务记录</h2>
<p>一次 chunk 不保证恰好是一行日志、一个 JSON 对象或一个完整 UTF-8 字符。按行处理需要保留跨块残片，文本解码需要正确处理字符边界；流式网络协议同样不能直接对每个 chunk 做 JSON.parse。</p>
<p>如果把所有 chunk 收集进数组后再 Buffer.concat，虽然读取过程用了流，最终仍会持有完整内容。业务若必须全量排序或读取整个 JSON 才处理，可能需要重新设计数据格式或采用外部存储，而不是只换一个读取 API。</p>
<h2>取消也是管道设计的一部分</h2>
<p>pipeline 支持 AbortSignal，可用于用户取消或超时。取消会影响相关流，但不能自动撤回远端已经收到的数据，也不能保证自定义 Transform 中另外启动的工作会自行停止；这些操作也要配合信号和清理。</p>
<p>流适合大文件、上传下载、压缩和持续日志等场景。对很小的数据，直接读取可能更容易维护。选择流的价值在于有限缓冲和持续处理，而不是“所有 I/O 都应该写成流”。</p>`};export{e as default};