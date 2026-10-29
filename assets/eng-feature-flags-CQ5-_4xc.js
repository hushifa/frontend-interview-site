var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>功能开关就是在代码里放一个判断，开关打开才走新功能。这样新代码可以先部署上线，等准备好了再打开，“代码已部署”和“功能已上线”就分开了。灰度发布、紧急关闭、A/B 实验都靠它。</p>
<p>灰度的时候，要用稳定的用户标识做哈希来分组，保证同一个用户每次看到的都是同一个版本。最好由服务端算出结果，前后端用同一份。</p>
<p>开关值要有默认值。配置服务挂了，也要按保守的行为运行，通常就是旧功能。</p>
<p>要注意两点。第一，开关不是权限，前端隐藏按钮只影响展示，接口必须在服务端单独校验。第二，每个开关都要有负责人和删除时间，全量以后把旧代码清掉。</p>
</blockquote>
<h2>开关有哪几种用途</h2>
<p>开关按目的大致分几类，它们的寿命也不一样。</p>
<p>发布开关用来让还没做完的功能先合进主干，然后按比例放量，全量以后就该删掉，寿命很短。运维开关用来在故障时关掉高成本的功能，比如推荐、实时预览，它会长期保留。实验开关用于 A/B 测试，比较两组的指标，实验结束就删除。</p>
<p>还有一类经常被混进来，就是权限和套餐，决定谁有资格用某个功能。这其实是业务规则，不应该放进开关系统。</p>
<p>把这几类混在一个配置里，最常见的后果是“临时开关”活了好几年，或者有人拿开关代替权限校验。</p>
<h2>灰度分流为什么要稳定</h2>
<p>下面是一个分桶函数，把用户分到 0 到 99 之间的某个桶，桶号小于放量比例的用户看到新功能。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">bucket</span>(<span class="hljs-params">userId, flagKey</span>) {
  <span class="hljs-keyword">const</span> data = <span class="hljs-keyword">new</span> <span class="hljs-title class_">TextEncoder</span>().<span class="hljs-title function_">encode</span>(<span class="hljs-string">\`<span class="hljs-subst">\${flagKey}</span>:<span class="hljs-subst">\${userId}</span>\`</span>);
  <span class="hljs-keyword">const</span> hash = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>(<span class="hljs-keyword">await</span> crypto.<span class="hljs-property">subtle</span>.<span class="hljs-title function_">digest</span>(<span class="hljs-string">&#x27;SHA-256&#x27;</span>, data));
  <span class="hljs-keyword">return</span> ((hash[<span class="hljs-number">0</span>] &lt;&lt; <span class="hljs-number">8</span>) | hash[<span class="hljs-number">1</span>]) % <span class="hljs-number">100</span>; <span class="hljs-comment">// 0–99</span>
}

<span class="hljs-keyword">const</span> enabled = (<span class="hljs-keyword">await</span> <span class="hljs-title function_">bucket</span>(user.<span class="hljs-property">id</span>, <span class="hljs-string">&#x27;new-checkout&#x27;</span>)) &lt; rolloutPercent;
</code></pre></div>
<p>为什么不用 <code>Math.random()</code>？因为随机数每次都不一样，用户刷新一下页面就可能换了版本。哈希不一样，同样的输入永远得到同样的结果，所以同一个用户总是落在同一个桶里。</p>
<p><code>flagKey</code> 也参与哈希，是为了让不同开关的放量用户互不相关，不会总是同一批人当“小白鼠”。放量比例只增不减的话，已经进入新版本的用户会一直留在新版本。</p>
<p>更稳妥的做法是由服务端算出结果，随页面数据或接口一起返回，前端只读取结果。这样前后端的判断一定一致，接口也能按同一个结果决定行为。</p>
<h2>开关值怎样获取和更新</h2>
<p>首屏需要的开关，应该随 HTML 或第一个接口一起下发。否则页面会先按旧版本渲染，拿到开关后又闪成新版本。</p>
<p>配置服务超时或失败时，用代码里的默认值。默认值要选保守的行为，通常是旧功能。</p>
<p>页面打开很久的话，可以定期刷新开关。但紧急关闭必须在服务端同时生效，不能指望用户的前端去刷新。</p>
<p>另外，要把用户所在的分组记进埋点和错误日志。否则出了问题，你分不清它来自哪个版本。</p>
<h2>为什么隐藏按钮不算安全控制</h2>
<p>前端拿到的开关值，用户自己就能改。所以新功能对应的接口，必须在服务端检查同一个开关和用户权限。</p>
<p>还有一点容易忽略：没开放的功能代码如果包含敏感信息，比如还没公布的价格、内部接口，就不该提前打进公开的产物，因为产物谁都能下载。</p>
<h2>开关用完怎样清理</h2>
<p>每个开关都要登记负责人、用途和计划删除时间。全量以后，把开关判断和旧分支的代码一起删掉，还可以在 CI 里统计那些存在很久的发布开关。</p>
<p>清理很重要，因为开关组合越多，需要测试的路径就越多，代码也越难读。</p>
<h2>常见追问</h2>
<p><strong>灰度期间出了问题，怎样回滚？</strong></p>
<blockquote>
<p>把放量比例调回 0，或者打开运维开关，不需要重新部署。前提是新旧版本的数据格式兼容，否则新版本已经写入的数据，旧版本可能读不了。</p>
</blockquote>
<p><strong>开关能代替发布分支吗？</strong></p>
<blockquote>
<p>可以减少长期存在的分支，大家都往主干合代码。但代价是新旧两条路径都要测试。</p>
</blockquote>`};export{e as default};