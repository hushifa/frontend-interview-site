var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>两者都是限制发送方“一次能发多少”，区别在于怕把谁塞满。流量控制怕的是接收方：接收方在每个 ACK 里告诉发送方自己还剩多少缓冲空间，这个值叫接收窗口 rwnd。拥塞控制怕的是中间的网络：发送方自己估计网络能承受多少，维护一个拥塞窗口 cwnd。RFC 5681 规定，未确认的数据不能超过 cwnd 和 rwnd 中较小的那个。</p>
<p>拥塞控制分四个算法。连接刚建立时不知道网络状况，cwnd 从很小的初始窗口开始，每收到一个确认新数据的 ACK 就涨，大约每个往返翻一倍，这叫慢启动。涨到阈值 ssthresh 以后改为每个往返只加一个报文段，叫拥塞避免。</p>
<p>丢包被当作拥塞的信号。如果是重传定时器超时，说明情况比较严重，ssthresh 降到在途数据量的一半，cwnd 退回一个报文段重新慢启动。如果是连续收到 3 个重复 ACK，说明后面的包还在陆续到达，就不等超时直接重传丢失的那个，这叫快速重传，之后进入快速恢复，cwnd 减半左右继续发，不回到 1。</p>
<p>要注意，RFC 5681 描述的是标准的基础算法。按 RFC 9438 的说法，Linux、Windows 和 Apple 的协议栈默认用的是 CUBIC，它改变了拥塞避免阶段窗口的增长方式。面试时讲清这套基础模型即可，不要把它说成所有系统的具体实现。</p>
</blockquote>
<h2>流量控制：接收方说了算</h2>
<p>TCP 首部里有一个窗口字段，接收方每次发 ACK 都会带上它，表示“从这个确认号往后，我还能收多少字节”。发送方在 RFC 9293 里用 <code>SND.WND</code> 记录这个值，发出去但没确认的数据不能超出它。</p>
<p>接收方的应用读得慢，缓冲区满了，就会通告窗口为 0，发送方只好停下。可是窗口重新打开的那个 ACK 本身也可能丢失，双方就会互相干等。所以 RFC 9293 要求发送方必须支持零窗口探测：窗口为 0 持续一个重传超时以后，发一个小探测段，迫使接收方回复当前窗口，探测间隔按指数增长。</p>
<h2>拥塞控制：发送方自己估计</h2>
<p>接收方缓冲区再大，中间路由器的队列也可能被挤满。网络不会直接告诉发送方“我堵了”，所以发送方只能通过丢包去推断，并用 <code>cwnd</code> 约束自己。RFC 5681 的原话是：任何时候，发送的序号不能超过“已确认的最高序号 + min(cwnd, rwnd)”。</p>
<p>下面用报文段为单位做一个简化模拟，每轮代表一个往返，看 <code>cwnd</code> 怎么变化。假设 <code>ssthresh</code> 初始为 8，第 6 轮发生超时。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> cwnd = <span class="hljs-number">1</span>;
<span class="hljs-keyword">let</span> ssthresh = <span class="hljs-number">8</span>;
<span class="hljs-keyword">const</span> log = [];
<span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> round = <span class="hljs-number">1</span>; round &lt;= <span class="hljs-number">9</span>; round++) {
  log.<span class="hljs-title function_">push</span>(<span class="hljs-string">\`<span class="hljs-subst">\${round}</span>:<span class="hljs-subst">\${cwnd}</span>\`</span>);
  <span class="hljs-keyword">if</span> (round === <span class="hljs-number">6</span>) {
    ssthresh = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(<span class="hljs-title class_">Math</span>.<span class="hljs-title function_">floor</span>(cwnd / <span class="hljs-number">2</span>), <span class="hljs-number">2</span>);
    cwnd = <span class="hljs-number">1</span>;
  } <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (cwnd &lt; ssthresh) {
    cwnd = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(cwnd * <span class="hljs-number">2</span>, ssthresh);
  } <span class="hljs-keyword">else</span> {
    cwnd += <span class="hljs-number">1</span>;
  }
}
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(log.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27; &#x27;</span>)); <span class="hljs-comment">// 1:1 2:2 3:4 4:8 5:9 6:10 7:1 8:2 9:4</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;ssthresh =&#x27;</span>, ssthresh); <span class="hljs-comment">// ssthresh = 5</span>

<span class="hljs-keyword">const</span> <span class="hljs-title function_">canSend</span> = (<span class="hljs-params">cwnd, rwnd</span>) =&gt; <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(cwnd, rwnd);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">canSend</span>(<span class="hljs-number">10</span>, <span class="hljs-number">4</span>)); <span class="hljs-comment">// 4</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">canSend</span>(<span class="hljs-number">3</span>, <span class="hljs-number">64</span>)); <span class="hljs-comment">// 3</span>
</code></pre></div>
<p>前 4 轮 <code>cwnd</code> 按 1、2、4、8 翻倍，这是慢启动。为什么叫“慢”却涨得这么快？因为它是从很小的窗口起步的，相对“一上来就按最大速度发”算慢。到了 <code>ssthresh</code> 以后每轮只加 1，这是拥塞避免。</p>
<p>第 6 轮超时，<code>ssthresh</code> 变成当时窗口的一半，也就是 5，<code>cwnd</code> 退回 1，又从慢启动开始。模拟里把在途数据量近似为 <code>cwnd</code>；RFC 用的是 FlightSize，也就是实际发出但未确认的数据量，公式是 <code>ssthresh = max(FlightSize / 2, 2*SMSS)</code>。</p>
<p>最后两行说明流量控制和拥塞控制同时生效：网络允许发 10 个但接收方只能收 4 个，就只发 4 个；接收方能收 64 个但网络只允许 3 个，就只发 3 个。</p>
<h2>初始窗口有多大</h2>
<p>RFC 5681 给初始窗口定的上限跟报文段大小有关：最大报文段不超过 1095 字节时最多 4 个，在 1095 到 2190 字节之间最多 3 个，更大时最多 2 个。<code>ssthresh</code> 的初始值则建议设得很高，让网络状况决定什么时候停止慢启动。后来 RFC 6928 作为实验性标准提出把初始窗口提高到 <code>min(10*MSS, max(2*MSS, 14600))</code> 字节，大约 10 个报文段。</p>
<h2>为什么 3 个重复 ACK 不用退回慢启动</h2>
<p>接收方收到乱序的报文段时，会重复确认它还在等的那个序号，这就是重复 ACK。能收到重复 ACK，说明后面的报文段已经到达接收方，离开了网络，网络并没有完全堵死。</p>
<p>所以 RFC 5681 的做法是：收到第 3 个重复 ACK 时，把 <code>ssthresh</code> 设为在途数据量的一半，立刻重传丢失的报文段，把 <code>cwnd</code> 设为 <code>ssthresh + 3</code> 个报文段。之后每多一个重复 ACK，<code>cwnd</code> 再加一个报文段；等确认新数据的 ACK 到来，<code>cwnd</code> 收回到 <code>ssthresh</code>，继续拥塞避免。这样不用等超时，也不用从 1 重新开始。</p>
<h2>常见追问</h2>
<p><strong>这些和前端有什么关系？</strong></p>
<blockquote>
<p>慢启动意味着新连接一开始发不了多少数据，所以首屏关键资源小一点、复用已有连接，都能少等几个往返。HTTP 的持久连接能复用已经“热起来”的连接，见<a href="/questions/network-keep-alive/">《HTTP Keep-Alive 和持久连接是怎么回事？》</a>。</p>
</blockquote>
<p><strong>连接空闲很久以后还能保持原来的窗口吗？</strong></p>
<blockquote>
<p>不一定。RFC 5681 描述了广泛部署的做法：超过一个重传超时都没收到报文段时，发送前先把 <code>cwnd</code> 降到重启窗口，也就是 <code>min(IW, cwnd)</code>，再用慢启动重新建立 ACK 节奏，因为空闲期间网络状况可能已经变了。</p>
</blockquote>
<p><strong>流量控制和拥塞控制哪个窗口是写在报文里的？</strong></p>
<blockquote>
<p>只有接收窗口写在 TCP 首部的窗口字段里，由接收方通告。拥塞窗口是发送方内部的状态变量，不会出现在报文中。</p>
</blockquote>`};export{e as default};