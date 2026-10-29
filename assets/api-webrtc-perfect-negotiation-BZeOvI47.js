var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>视频通话里，A 打开屏幕共享，B 同时打开摄像头，两边都要重新协商，各自发出一个 offer，这就撞车了，术语叫协商碰撞（glare）。</p>
<p>perfect negotiation 的思路是事先定好谁让步。一端设 <code>polite = true</code>（礼貌方），另一端设 <code>false</code>（不礼貌方），比如先连上信令服务器的那端当礼貌方。撞车时，不礼貌方直接忽略收到的 offer；礼貌方照样 <code>setRemoteDescription(offer)</code>，浏览器会隐式回滚它自己的 offer，然后应答。</p>
<p>判断是否撞车，要用自己维护的 <code>makingOffer</code> 和 <code>isSettingRemoteAnswerPending</code>，不能只看 <code>signalingState</code>，因为它是异步变化的，会漏判。</p>
<p>还有一个细节：被忽略的 offer 还会带来一些 ICE 候选，<code>addIceCandidate</code> 报错时要忽略掉。两端代码完全一样，只有 <code>polite</code> 不同。</p>
</blockquote>
<h2>完整代码</h2>
<p>下面是 MDN 推荐的写法，两端都跑这段代码。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 两端代码相同，只有 polite 不同：一端为 true，另一端为 false。</span>
<span class="hljs-keyword">const</span> polite = isFirstToJoin;
<span class="hljs-keyword">let</span> makingOffer = <span class="hljs-literal">false</span>;
<span class="hljs-keyword">let</span> ignoreOffer = <span class="hljs-literal">false</span>;
<span class="hljs-keyword">let</span> isSettingRemoteAnswerPending = <span class="hljs-literal">false</span>;

pc.<span class="hljs-property">onnegotiationneeded</span> = <span class="hljs-title function_">async</span> () =&gt; {
  <span class="hljs-keyword">try</span> {
    makingOffer = <span class="hljs-literal">true</span>;
    <span class="hljs-keyword">await</span> pc.<span class="hljs-title function_">setLocalDescription</span>();
    signaler.<span class="hljs-title function_">send</span>({ <span class="hljs-attr">description</span>: pc.<span class="hljs-property">localDescription</span> });
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">error</span>(error);
  } <span class="hljs-keyword">finally</span> {
    makingOffer = <span class="hljs-literal">false</span>;
  }
};

pc.<span class="hljs-property">onicecandidate</span> = <span class="hljs-function">(<span class="hljs-params">{ candidate }</span>) =&gt;</span> signaler.<span class="hljs-title function_">send</span>({ candidate });

signaler.<span class="hljs-property">onmessage</span> = <span class="hljs-title function_">async</span> ({ <span class="hljs-attr">data</span>: { description, candidate } }) =&gt; {
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">if</span> (description) {
      <span class="hljs-keyword">const</span> readyForOffer =
        !makingOffer &amp;&amp; (pc.<span class="hljs-property">signalingState</span> === <span class="hljs-string">&#x27;stable&#x27;</span> || isSettingRemoteAnswerPending);
      <span class="hljs-keyword">const</span> offerCollision = description.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;offer&#x27;</span> &amp;&amp; !readyForOffer;

      ignoreOffer = !polite &amp;&amp; offerCollision;
      <span class="hljs-keyword">if</span> (ignoreOffer) <span class="hljs-keyword">return</span>;

      isSettingRemoteAnswerPending = description.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;answer&#x27;</span>;
      <span class="hljs-keyword">await</span> pc.<span class="hljs-title function_">setRemoteDescription</span>(description);
      isSettingRemoteAnswerPending = <span class="hljs-literal">false</span>;

      <span class="hljs-keyword">if</span> (description.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;offer&#x27;</span>) {
        <span class="hljs-keyword">await</span> pc.<span class="hljs-title function_">setLocalDescription</span>();
        signaler.<span class="hljs-title function_">send</span>({ <span class="hljs-attr">description</span>: pc.<span class="hljs-property">localDescription</span> });
      }
    } <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (candidate) {
      <span class="hljs-keyword">try</span> {
        <span class="hljs-keyword">await</span> pc.<span class="hljs-title function_">addIceCandidate</span>(candidate);
      } <span class="hljs-keyword">catch</span> (error) {
        <span class="hljs-keyword">if</span> (!ignoreOffer) <span class="hljs-keyword">throw</span> error;
      }
    }
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">error</span>(error);
  }
};
</code></pre></div>
<p>核心就两行：<code>offerCollision</code> 判断收到的 offer 是不是撞车了，<code>ignoreOffer = !polite &amp;&amp; offerCollision</code> 决定要不要忽略。礼貌方从来不忽略，所以会走到 <code>setRemoteDescription</code>，让浏览器回滚自己的 offer。</p>
<h2>为什么要自己维护 makingOffer</h2>
<p><code>setLocalDescription()</code> 是异步的。从开始创建 offer 到真正发出去这段时间，<code>signalingState</code> 可能还是 <code>stable</code>。如果这时收到对方的 offer，只看状态会以为没撞车，可实际上自己的 offer 马上就要发出去了。所以要用 <code>makingOffer</code> 标记“我正在发 offer”。</p>
<h2>isSettingRemoteAnswerPending 是干什么的</h2>
<p>本端正在应用对方的 answer 时，状态还是 <code>have-local-offer</code>，看起来像是“我发了 offer 还没完成”。但其实协商马上就会回到 <code>stable</code>，这时收到对方的新 offer，并不是撞车，只要排在后面处理就行。这个标记就是为了不把这种情况误判成碰撞。</p>
<h2>不传参数的 setLocalDescription 和隐式回滚</h2>
<p>代码里 <code>setLocalDescription()</code> 没传参数。浏览器会根据当前状态自动创建 offer 或 answer，所以不用自己写 <code>createOffer</code>、<code>createAnswer</code> 和状态判断。</p>
<p>隐式回滚是指：礼貌方处于 <code>have-local-offer</code> 状态时，调用 <code>setRemoteDescription(offer)</code>，现代浏览器会自动把本地的 offer 撤回，不需要手动传 <code>{ type: &#x27;rollback&#x27; }</code>。</p>
<h2>为什么两端代码一样</h2>
<p>两端只有 <code>polite</code> 的值不同，其他逻辑完全相同。所以任何一端都可以随时添加或移除轨道、重启 ICE，<code>negotiationneeded</code> 会自动触发协商，撞车了就由角色决定谁让步，不用区分谁是“呼叫方”。</p>
<h2>常见追问</h2>
<p><strong>为什么 addIceCandidate 报错时要忽略？</strong></p>
<blockquote>
<p>不礼貌方忽略了对方的 offer，但对方还会继续发这个 offer 对应的 ICE 候选。这些候选没有对应的远端描述，添加时会报错。这时 <code>ignoreOffer</code> 为 <code>true</code>，报错就忽略；否则才是真错误，要抛出去。</p>
</blockquote>
<p><strong>能不能只用 signalingState 判断碰撞？</strong></p>
<blockquote>
<p>不能。状态是异步变化的，创建 offer 的过程中它可能还是 <code>stable</code>，会漏判。所以要配合 <code>makingOffer</code> 和 <code>isSettingRemoteAnswerPending</code> 一起判断。</p>
</blockquote>`};export{e as default};