var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如做一个短视频发布页：用户选一段视频，前端先截一帧当封面给用户确认，再把视频分片上传；发布后的视频和直播用 HLS 播放。</p>
<p>截封面不需要服务端。用 <code>URL.createObjectURL(file)</code> 把本地文件交给一个 <code>&lt;video&gt;</code>，把 <code>currentTime</code> 设到想要的时间点，等 <code>seeked</code> 事件触发，说明画面已经跳过去了，这时用 <code>drawImage(video, ...)</code> 把当前帧画到 canvas 上，再 <code>toBlob</code> 导出图片。视频本身的上传和普通大文件一样，分片、断点续传。</p>
<p>播放 HLS 时，HLS 是把视频切成几秒一段的小文件，再用 <code>.m3u8</code> 播放列表列出来。Safari 等浏览器原生支持，<code>canPlayType(&#x27;application/vnd.apple.mpegurl&#x27;)</code> 有返回值时直接设 <code>src</code> 就能播；Chrome 等不原生支持的浏览器，用 hls.js，它下载分片后通过 MSE（Media Source Extensions）把数据喂给 <code>&lt;video&gt;</code>。hls.js 官方建议先判断 <code>Hls.isSupported()</code>，因为 <code>canPlayType</code> 在 Chrome 里也可能返回 <code>maybe</code>。</p>
<p>直播延迟主要来自分片时长。HLS 规范要求，直播时客户端不应该从离播放列表末尾不足三个目标时长的分片开始播，所以分片 6 秒，播放器起点就落后最新画面至少十几秒。LL-HLS（低延迟 HLS）把分片再切成几百毫秒的部分分片，并让服务端挂起播放列表请求、有新内容立刻返回，Apple 文档说它能把延迟降到普通电视广播的水平。</p>
</blockquote>
<h2>怎样截取视频封面</h2>
<p><code>drawImage</code> 不只能画图片，也能画 <code>&lt;video&gt;</code>。HTML 规范说明，传入视频元素时，画的是调用那一刻当前播放位置的那一帧。所以截封面就是两步：让视频跳到某个时间点，再把那一帧画下来。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">captureFrame</span>(<span class="hljs-params">file, time = <span class="hljs-number">1</span></span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> url = <span class="hljs-variable constant_">URL</span>.<span class="hljs-title function_">createObjectURL</span>(file);
    <span class="hljs-keyword">const</span> video = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;video&#x27;</span>);
    video.<span class="hljs-property">muted</span> = <span class="hljs-literal">true</span>;
    video.<span class="hljs-property">preload</span> = <span class="hljs-string">&#x27;auto&#x27;</span>;
    video.<span class="hljs-property">src</span> = url;

    video.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;loadedmetadata&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
      <span class="hljs-comment">// 视频比 time 还短时，取中间的一帧</span>
      video.<span class="hljs-property">currentTime</span> = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(time, video.<span class="hljs-property">duration</span> / <span class="hljs-number">2</span>);
    });

    video.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;seeked&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
      <span class="hljs-keyword">const</span> canvas = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;canvas&#x27;</span>);
      canvas.<span class="hljs-property">width</span> = video.<span class="hljs-property">videoWidth</span>;
      canvas.<span class="hljs-property">height</span> = video.<span class="hljs-property">videoHeight</span>;
      canvas.<span class="hljs-title function_">getContext</span>(<span class="hljs-string">&#x27;2d&#x27;</span>).<span class="hljs-title function_">drawImage</span>(video, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>);
      canvas.<span class="hljs-title function_">toBlob</span>(<span class="hljs-function">(<span class="hljs-params">blob</span>) =&gt;</span> {
        <span class="hljs-variable constant_">URL</span>.<span class="hljs-title function_">revokeObjectURL</span>(url);
        blob ? <span class="hljs-title function_">resolve</span>(blob) : <span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;截图失败&#x27;</span>));
      }, <span class="hljs-string">&#x27;image/jpeg&#x27;</span>, <span class="hljs-number">0.85</span>);
    });

    video.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;error&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
      <span class="hljs-variable constant_">URL</span>.<span class="hljs-title function_">revokeObjectURL</span>(url);
      <span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;无法解码这个视频&#x27;</span>));
    });
  });
}
</code></pre></div>
<p>为什么要等 <code>seeked</code>，不能设完 <code>currentTime</code> 马上画？因为跳转是异步的，设完时间以后画面还没有解码出来。MDN 说明，<code>seeked</code> 在跳转操作完成、当前播放位置已经改变、<code>seeking</code> 变回 <code>false</code> 时触发。HTML 规范还规定，视频的 <code>readyState</code> 还是 <code>HAVE_NOTHING</code> 或 <code>HAVE_METADATA</code> 时，<code>drawImage</code> 什么都不会画，也就是还没有当前帧的数据。</p>
<p>为什么不截第 0 秒？很多视频开头是黑屏或者渐入，取第 1 秒左右更像样。产品上也可以一次截几帧让用户选。</p>
<p>还要注意，浏览器能不能解码这个视频，取决于它支持的编码格式。用户选了一个浏览器不支持的格式，就会走到 <code>error</code> 分支，这时可以让服务端转码后再生成封面。</p>
<h2>视频文件怎样上传</h2>
<p>视频文件动辄几百 MB，上传和其他大文件一样：切成固定大小的分片并发上传，记录已完成的分片实现断点续传，用文件摘要实现秒传，见<a href="/questions/design-large-upload/">《大文件上传系统怎样设计秒传、服务端合并、存储和限流？》</a>。</p>
<p>上传以后，服务端通常会把视频转码成几种清晰度，并切成 HLS 分片。浏览器播放的就是这些分片，而不是用户上传的原始文件。</p>
<h2>HLS 是怎样播放的</h2>
<p>HLS（HTTP Live Streaming）把视频切成一段一段的小文件，再用一个文本格式的播放列表（<code>.m3u8</code>）按顺序列出这些分片的地址和时长。播放器先下载播放列表，再依次下载分片播放；直播时播放列表会不断追加新分片，播放器定期重新拉取。</p>
<p>浏览器对 HLS 的支持分两种情况。Safari 等浏览器原生支持，直接把 <code>.m3u8</code> 地址设给 <code>src</code> 就能播。其他浏览器不认识 <code>.m3u8</code>，就要用 JavaScript 来做：hls.js 下载播放列表和分片，然后通过 MSE 把数据交给 <code>&lt;video&gt;</code>。MDN 解释，MSE 让页面可以把 <code>&lt;video&gt;</code> 的 <code>src</code> 换成一个 <code>MediaSource</code> 对象，由 JavaScript 往它的 <code>SourceBuffer</code> 里追加媒体数据。hls.js 的 README 还说明，在没有 MSE 的环境里（iOS 17.1 起的 Safari），它会改用 Managed Media Source。</p>
<p>hls.js 官方给出的默认写法如下：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">if</span> (<span class="hljs-title class_">Hls</span>.<span class="hljs-title function_">isSupported</span>()) {
  <span class="hljs-keyword">const</span> hls = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Hls</span>();
  hls.<span class="hljs-title function_">loadSource</span>(videoSrc);
  hls.<span class="hljs-title function_">attachMedia</span>(video);
} <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (video.<span class="hljs-title function_">canPlayType</span>(<span class="hljs-string">&#x27;application/vnd.apple.mpegurl&#x27;</span>)) {
  video.<span class="hljs-property">src</span> = videoSrc;
}
</code></pre></div>
<p>为什么先判断 hls.js，而不是先判断原生支持？README 解释，<code>canPlayType</code> 在 Chrome 等浏览器里可能返回 <code>maybe</code>，但实际原生播放某些流会失败，所以除非确实需要原生播放，推荐先用 <code>Hls.isSupported()</code>。MDN 也说明，<code>canPlayType</code> 只返回 <code>probably</code>、<code>maybe</code> 或空字符串，<code>maybe</code> 表示在真正尝试播放之前无法确定。</p>
<h2>直播延迟从哪里来</h2>
<p>直播的延迟，指主播那边发生的画面要过多久才出现在观众屏幕上。编码、上传、转码都会占一些时间，但对 HLS 来说，最大的一块来自分片。</p>
<p>原因有两层。第一，一个分片要完整生成以后才能写进播放列表，分片 6 秒，最新的画面至少要等这 6 秒录完才能被下载。第二，HLS 规范（RFC 8216）要求，播放列表没有结束标记时，客户端不应该从距离播放列表末尾不足三个目标时长的分片开始播放，否则容易卡顿。所以播放器一开始就会主动退后几个分片，留出缓冲。</p>
<p>下面按规范的这条规则，算一算播放器起播位置离最新内容有多远：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">startIndex</span>(<span class="hljs-params">segments, targetDuration</span>) {
  <span class="hljs-keyword">let</span> fromEnd = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = segments.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>; i &gt;= <span class="hljs-number">0</span>; i--) {
    fromEnd += segments[i];
    <span class="hljs-keyword">if</span> (fromEnd &gt;= targetDuration * <span class="hljs-number">3</span>) <span class="hljs-keyword">return</span> i;
  }
  <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">behindLiveEdge</span>(<span class="hljs-params">segments, targetDuration</span>) {
  <span class="hljs-keyword">const</span> index = <span class="hljs-title function_">startIndex</span>(segments, targetDuration);
  <span class="hljs-keyword">return</span> segments.<span class="hljs-title function_">slice</span>(index).<span class="hljs-title function_">reduce</span>(<span class="hljs-function">(<span class="hljs-params">sum, value</span>) =&gt;</span> sum + value, <span class="hljs-number">0</span>);
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">startIndex</span>([<span class="hljs-number">6</span>, <span class="hljs-number">6</span>, <span class="hljs-number">6</span>, <span class="hljs-number">6</span>, <span class="hljs-number">6</span>], <span class="hljs-number">6</span>)); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">behindLiveEdge</span>([<span class="hljs-number">6</span>, <span class="hljs-number">6</span>, <span class="hljs-number">6</span>, <span class="hljs-number">6</span>, <span class="hljs-number">6</span>], <span class="hljs-number">6</span>)); <span class="hljs-comment">// 18</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">behindLiveEdge</span>([<span class="hljs-number">2</span>, <span class="hljs-number">2</span>, <span class="hljs-number">2</span>, <span class="hljs-number">2</span>, <span class="hljs-number">2</span>, <span class="hljs-number">2</span>, <span class="hljs-number">2</span>], <span class="hljs-number">2</span>)); <span class="hljs-comment">// 6</span>
</code></pre></div>
<p>播放列表里有 5 个 6 秒的分片。从倒数第三个分片（下标 2）开始，到末尾正好是 18 秒，也就是三个目标时长；再往后的分片离末尾不足 18 秒，按规范不应该从那里起播。所以播放器至少落后最新内容 18 秒，再加上最新分片本身要录满 6 秒才能发布，延迟就更大了。</p>
<p>把分片缩到 2 秒，同样的规则下只落后 6 秒。可是分片越短，播放列表刷新越频繁，请求数量越多，编码效率也受影响，所以普通 HLS 靠缩短分片降低延迟是有限度的。</p>
<h2>LL-HLS 怎样降低延迟</h2>
<p>Apple 的低延迟 HLS（LL-HLS）文档给出的思路是：在播放列表的最新位置，额外提供更小的“部分分片”（Partial Segment）。文档举的例子是，普通分片 6 秒，部分分片可能只有 200 毫秒，录好 200 毫秒就能发布，30 个部分分片加起来，正好等于随后发布的那个 6 秒完整分片。这样播放器不用等一整个分片录完。</p>
<p>另外几项机制减少的是等待和往返。阻塞式播放列表刷新：客户端请求播放列表时带上 <code>_HLS_msn</code>（想要的分片序号）等参数，服务端把请求挂起，直到包含这个分片的新版本播放列表生成才返回，省掉了轮询。预加载提示：服务端用 <code>EXT-X-PRELOAD-HINT</code> 提前告诉客户端下一个部分分片的地址，客户端可以提前发请求，数据一生成服务端就返回。播放列表增量更新减少每次刷新传输的数据量，Rendition Report 让切换清晰度时少走几次往返。</p>
<p>Apple 文档对效果的描述是，低延迟模式能把公网上的视频延迟降到普通电视广播的水平。hls.js 的 README 也列出它支持 LL-HLS 的部分分片、阻塞式播放列表刷新、增量更新和 Rendition Report。要注意，这些都需要服务端和 CDN 配合实现，前端只换播放器是不够的。</p>
<h2>常见追问</h2>
<p><strong>截封面时画布被污染、<code>toBlob</code> 报错，是什么原因？</strong></p>
<blockquote>
<p>视频和图片一样受 CORS 限制。HTML 规范规定，视频的媒体数据是 CORS 跨域的，画进画布后画布就不再是 origin-clean，导出会抛 <code>SecurityError</code>。用户本地选择的文件通过 object URL 加载，不存在这个问题；截网络上的视频时，要给 <code>&lt;video&gt;</code> 加 <code>crossorigin</code>，服务器也要返回 CORS 头。</p>
</blockquote>
<p><strong>MSE 和直接设置 <code>src</code> 有什么区别？</strong></p>
<blockquote>
<p>直接设置 <code>src</code> 时，下载、缓冲、切换都由浏览器自己完成。MSE 把这些交给 JavaScript：页面自己决定下载哪个分片、什么时候下载、选哪种清晰度，再把数据追加进 <code>SourceBuffer</code>。hls.js 这类播放器就是靠 MSE，在不原生支持 HLS 的浏览器里实现 HLS 播放和自适应码率。</p>
</blockquote>
<p><strong>直播要求延迟一两秒以内，HLS 还合适吗？</strong></p>
<blockquote>
<p>普通 HLS 按上面的规则会落后好几个分片，做不到。LL-HLS 用部分分片把延迟降下来，但需要服务端和 CDN 都支持。连麦这类双方实时对话的场景，一般改用 WebRTC，见<a href="/questions/api-webrtc/">《WebRTC 为什么需要信令、STUN 和 TURN？》</a>。</p>
</blockquote>`};export{e as default};