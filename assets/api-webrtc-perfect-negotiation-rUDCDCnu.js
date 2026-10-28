var e={answerHtml:`<h2>简答</h2>
<ul>
<li>双方同时添加轨道或重新协商时，会各自发出 offer，这叫协商碰撞（glare）。</li>
<li>一方设为 <code>polite = true</code>，另一方为 <code>false</code>，例如先连上信令服务器的一方是礼貌方。</li>
<li>判断碰撞用自己维护的 <code>makingOffer</code> 和 <code>isSettingRemoteAnswerPending</code>，不要只看 <code>signalingState</code>，它是异步变化的。</li>
<li>碰撞时不礼貌方忽略收到的 offer；礼貌方直接 <code>setRemoteDescription(offer)</code>，浏览器会隐式回滚自己的 offer，然后应答。</li>
<li>被忽略的 offer 附带的 ICE 候选，<code>addIceCandidate</code> 报错时要忽略。</li>
</ul>
<h2>完整代码</h2>
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
<h2>关键点解释</h2>
<ul>
<li><strong>不传参数的 <code>setLocalDescription()</code></strong>：浏览器根据当前状态自动创建 offer 或 answer，省去 <code>createOffer</code> 和状态判断。</li>
<li><strong><code>makingOffer</code></strong>：从开始创建 offer 到发送出去之间，<code>signalingState</code> 可能还是 <code>stable</code>，单看状态会漏判碰撞。</li>
<li><strong><code>isSettingRemoteAnswerPending</code></strong>：本端正在应用对方的 answer 时，状态仍是 <code>have-local-offer</code>，但协商马上就会回到 <code>stable</code>，这时收到新 offer 不算碰撞。</li>
<li><strong>隐式回滚</strong>：礼貌方在 <code>have-local-offer</code> 状态下调用 <code>setRemoteDescription(offer)</code>，现代浏览器会自动回滚本地 offer，不需要手动传 <code>{ type: &#x27;rollback&#x27; }</code>。</li>
</ul>
<h2>为什么双方代码一样</h2>
<p>两边只有 <code>polite</code> 不同，其他逻辑完全相同。任何一方都可以在任何时候添加或移除轨道、重启 ICE，<code>negotiationneeded</code> 会自动触发协商，碰撞由角色决定谁让步。</p>`};export{e as default};