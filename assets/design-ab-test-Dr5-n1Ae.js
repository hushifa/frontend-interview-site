var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>电商做了新版结算页，产品想知道它是不是真的能提高转化，就把用户随机分成 A、B 两组，一组看旧版一组看新版，跑够时间后对比支付成功率，这是 A/B 实验。它和灰度用的技术相近，但灰度问的是“新版有没有坏”，实验问的是“哪个方案更好”。</p>
<p>两者的核心都是分流，而且分流必须稳定。不能用 <code>Math.random()</code>，否则用户刷新一下就换了版本，体验混乱，数据也没法比。通常用用户 ID 加实验名算一个哈希，取模得到 0 到 99 的桶号，桶号小于比例的进新版。同样的输入永远得到同样的结果，调大比例时已经在新版的用户也不会被切回去。</p>
<p>前端要做三件事：分组结果最好随首屏数据一起下发，避免页面先渲染旧版再闪成新版；在用户真正看到实验内容时上报一次曝光；把分组信息带进所有埋点和错误日志，出了问题能分清是哪个版本。</p>
<p>要注意，实验跑起来以后不要中途改比例或者改目标人群，那会让分组失衡、结论失效。各组实际人数和设定比例明显对不上时，说明分流或上报有 bug，这时的数据不能用来下结论。</p>
</blockquote>
<h2>A/B 实验和灰度有什么不同</h2>
<p>两者用的技术几乎一样，都是按规则把用户分到不同的代码路径，区别在目的。</p>
<p>灰度的目的是降低发布风险。新功能先给一小部分用户，关注的是错误率、白屏、接口失败这类“有没有坏”的指标，确认安全后逐步放量直到全量，然后删掉开关。Martin Fowler 的文章把这种做法叫金丝雀发布，用的就是功能开关的基础设施。部署层怎样分流和回滚，见<a href="/questions/git-canary-release/">《前端怎样做灰度发布和金丝雀发布？出问题怎样回滚？》</a>。</p>
<p>A/B 实验的目的是做决策。比例通常是固定的，比如五五开，关注的是转化率、停留时长这类业务指标。文章指出，实验开关要保持足够长的时间，直到结果在统计上显著，可能是几小时也可能是几周；实验期间修改参数，结果很可能就不可信了。</p>
<h2>怎样做稳定分流</h2>
<p>下面用一个简单的哈希函数实现分桶。同一个用户、同一个实验，算出来的桶号永远一样。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// FNV-1a 32 位哈希：同一个字符串永远得到同一个数</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">hash</span>(<span class="hljs-params">text</span>) {
  <span class="hljs-keyword">let</span> value = <span class="hljs-number">0x811c9dc5</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; text.<span class="hljs-property">length</span>; i += <span class="hljs-number">1</span>) {
    value ^= text.<span class="hljs-title function_">charCodeAt</span>(i);
    value = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">imul</span>(value, <span class="hljs-number">0x01000193</span>);
  }
  <span class="hljs-keyword">return</span> value &gt;&gt;&gt; <span class="hljs-number">0</span>;
}

<span class="hljs-comment">// 用户 ID 和实验名一起哈希，换一个实验分组就重新打散</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">bucket</span>(<span class="hljs-params">userId, experiment</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">hash</span>(<span class="hljs-string">\`<span class="hljs-subst">\${experiment}</span>:<span class="hljs-subst">\${userId}</span>\`</span>) % <span class="hljs-number">100</span>;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">assign</span>(<span class="hljs-params">userId, experiment, treatmentPercent</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">bucket</span>(userId, experiment) &lt; treatmentPercent ? <span class="hljs-string">&#x27;B&#x27;</span> : <span class="hljs-string">&#x27;A&#x27;</span>;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">assign</span>(<span class="hljs-string">&#x27;user-42&#x27;</span>, <span class="hljs-string">&#x27;new-checkout&#x27;</span>, <span class="hljs-number">50</span>) === <span class="hljs-title function_">assign</span>(<span class="hljs-string">&#x27;user-42&#x27;</span>, <span class="hljs-string">&#x27;new-checkout&#x27;</span>, <span class="hljs-number">50</span>)); <span class="hljs-comment">// true</span>

<span class="hljs-keyword">let</span> countB = <span class="hljs-number">0</span>;
<span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; <span class="hljs-number">10000</span>; i += <span class="hljs-number">1</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-title function_">assign</span>(<span class="hljs-string">\`user-<span class="hljs-subst">\${i}</span>\`</span>, <span class="hljs-string">&#x27;new-checkout&#x27;</span>, <span class="hljs-number">10</span>) === <span class="hljs-string">&#x27;B&#x27;</span>) countB += <span class="hljs-number">1</span>;
}
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(countB); <span class="hljs-comment">// 1002，接近 10000 的 10%</span>

<span class="hljs-comment">// 比例从 10% 放大到 20%，原来在 B 组的用户仍然在 B 组</span>
<span class="hljs-keyword">let</span> stayed = <span class="hljs-literal">true</span>;
<span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; <span class="hljs-number">10000</span>; i += <span class="hljs-number">1</span>) {
  <span class="hljs-keyword">const</span> id = <span class="hljs-string">\`user-<span class="hljs-subst">\${i}</span>\`</span>;
  <span class="hljs-keyword">if</span> (<span class="hljs-title function_">assign</span>(id, <span class="hljs-string">&#x27;new-checkout&#x27;</span>, <span class="hljs-number">10</span>) === <span class="hljs-string">&#x27;B&#x27;</span> &amp;&amp; <span class="hljs-title function_">assign</span>(id, <span class="hljs-string">&#x27;new-checkout&#x27;</span>, <span class="hljs-number">20</span>) !== <span class="hljs-string">&#x27;B&#x27;</span>) stayed = <span class="hljs-literal">false</span>;
}
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(stayed); <span class="hljs-comment">// true</span>
</code></pre></div>
<p>第一个输出说明分组是稳定的。第二个输出是 1 万个用户里进入 B 组的人数，设定 10%，实际 1002 人，哈希分布得比较均匀。第三个输出说明放量时“桶号小于 10”的用户一定也“小于 20”，已经用上新版的人不会被切回旧版。</p>
<p>为什么要把实验名也放进哈希？如果只用用户 ID，桶号小的那批人会在每个实验里都进新版，各实验的结果互相干扰。加上实验名，每个实验都会把用户重新打散。</p>
<p>用户 ID 用什么？登录用户用账号 ID，未登录用户可以生成一个随机 ID 存在 Cookie 里。要注意未登录时分到 A 组、登录后用账号 ID 又分到 B 组的情况，需要事先决定以哪个 ID 为准。</p>
<p>分流最好在服务端做，结果随页面数据下发，前端只读取。这样接口和页面按同一个结果工作，前端也不用打包实验配置。功能开关整体怎样分类和清理，见<a href="/questions/eng-feature-flags/">《前端功能开关应该怎样设计？怎样分类、下发和清理？》</a>。</p>
<h2>前端怎样避免页面闪烁</h2>
<p>如果前端先渲染旧版，再异步请求分组结果，拿到后切成新版，用户就会看到页面闪一下。这不仅体验差，还会污染实验：B 组用户其实先看了 A 版。</p>
<p>所以首屏用到的分组，应该随 HTML 或第一个接口一起返回，渲染前就确定。做不到时，可以在拿到结果前先显示骨架屏，而不是先显示旧版。分组服务超时就用默认值，默认值选旧版。</p>
<h2>曝光和数据怎样上报</h2>
<p>曝光事件表示用户真的进入了实验、看到了实验内容。为什么不在分组时就算曝光？比如实验改的是结算页，可大部分被分组的用户根本没走到结算页，把他们也算进来，差异就被稀释了。</p>
<p>上报还要保证两组的丢失情况一致。GrowthBook 文档提到一个常见问题叫样本比例失衡（SRM）：设定五五开，实际两组人数差得明显。最常见的原因是分组在服务端完成，曝光却靠前端上报，而广告拦截、脚本报错、用户提前离开都会让前端上报丢失；机器人只请求页面不执行脚本，也会被分组却没有曝光。如果新版页面更慢、更容易报错，B 组的曝光丢得更多，比例就失衡了。</p>
<p>所以分组和曝光要尽量在同一处完成，上报逻辑不能因组别不同而不同。每条埋点和错误日志都带上实验名和组别，排查问题时才能按版本拆开看。</p>
<h2>常见追问</h2>
<p><strong>实验结果看起来很好，可以提前结束吗？</strong></p>
<blockquote>
<p>不建议看到显著就马上停。按常规的固定样本方法分析时，应该在开始前定好样本量或实验时长，到了再看结论。GrowthBook 文档把中途反复查看叫作 peeking 问题，它会让假阳性率高于设定的水平，也就是把偶然的波动当成真实效果。确实需要边跑边看，要改用专门支持这种做法的序贯检验。</p>
</blockquote>
<p><strong>灰度出了问题怎样快速回退？</strong></p>
<blockquote>
<p>开关值由服务端下发的话，把比例改成 0 就能让所有人回到旧版，不用重新发布前端。前提是旧版代码还在、旧版依赖的接口还兼容。前端静态资源的版本切换和回滚，见<a href="/questions/git-canary-release/">《前端怎样做灰度发布和金丝雀发布？出问题怎样回滚？》</a>。</p>
</blockquote>`};export{e as default};