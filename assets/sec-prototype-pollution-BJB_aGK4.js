var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>obj[&#x27;__proto__&#x27;]</code> 对普通对象指向 <code>Object.prototype</code>，继续赋值就修改了所有对象共享的原型。</li>
<li>入口通常是按路径设置值的工具函数、递归深合并、查询字符串解析成嵌套对象。</li>
<li><code>JSON.parse</code> 只会创建一个名为 <code>__proto__</code> 的自身属性，不会污染；危险发生在之后把它交给不安全的合并逻辑。</li>
<li>后果：<code>if (user.isAdmin)</code> 这类读取继承属性的判断被绕过，或者配置默认值被篡改，在 Node 中可能进一步导致代码执行。</li>
<li>防御：拒绝 <code>__proto__</code>、<code>constructor</code>、<code>prototype</code> 键；用 <code>Object.create(null)</code> 或 <code>Map</code> 存放动态键；按 schema 显式提取字段。</li>
</ul>
<h2>演示</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> record = {};
record[<span class="hljs-string">&#x27;__proto__&#x27;</span>][<span class="hljs-string">&#x27;demoPermission&#x27;</span>] = <span class="hljs-string">&#x27;admin&#x27;</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">hasOwn</span>(record, <span class="hljs-string">&#x27;demoPermission&#x27;</span>)); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>({}.<span class="hljs-property">demoPermission</span>); <span class="hljs-comment">// admin</span>
<span class="hljs-keyword">delete</span> <span class="hljs-title class_">Object</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>.<span class="hljs-property">demoPermission</span>;
</code></pre></div>
<p>一个不安全的深合并：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">merge</span>(<span class="hljs-params">target, source</span>) {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> key <span class="hljs-keyword">of</span> <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(source)) {
    <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> source[key] === <span class="hljs-string">&#x27;object&#x27;</span> &amp;&amp; source[key] !== <span class="hljs-literal">null</span>) {
      target[key] ??= {};
      <span class="hljs-title function_">merge</span>(target[key], source[key]);
    } <span class="hljs-keyword">else</span> {
      target[key] = source[key];
    }
  }
  <span class="hljs-keyword">return</span> target;
}

<span class="hljs-keyword">const</span> input = <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(<span class="hljs-string">&#x27;{&quot;__proto__&quot;:{&quot;preview&quot;:true}}&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>({}.<span class="hljs-property">preview</span>); <span class="hljs-comment">// undefined，JSON.parse 本身没有污染</span>
<span class="hljs-title function_">merge</span>({}, input);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>({}.<span class="hljs-property">preview</span>); <span class="hljs-comment">// true，合并时 target[&#x27;__proto__&#x27;] 指向了 Object.prototype</span>
</code></pre></div>
<h2>防御</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-variable constant_">BLOCKED</span> = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>([<span class="hljs-string">&#x27;__proto__&#x27;</span>, <span class="hljs-string">&#x27;constructor&#x27;</span>, <span class="hljs-string">&#x27;prototype&#x27;</span>]);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">safeMerge</span>(<span class="hljs-params">target, source</span>) {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> key <span class="hljs-keyword">of</span> <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(source)) {
    <span class="hljs-keyword">if</span> (<span class="hljs-variable constant_">BLOCKED</span>.<span class="hljs-title function_">has</span>(key)) <span class="hljs-keyword">continue</span>;
    <span class="hljs-keyword">const</span> value = source[key];
    <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> value === <span class="hljs-string">&#x27;object&#x27;</span> &amp;&amp; value !== <span class="hljs-literal">null</span> &amp;&amp; !<span class="hljs-title class_">Array</span>.<span class="hljs-title function_">isArray</span>(value)) {
      <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">hasOwn</span>(target, key)) target[key] = {};
      <span class="hljs-title function_">safeMerge</span>(target[key], value);
    } <span class="hljs-keyword">else</span> {
      target[key] = value;
    }
  }
  <span class="hljs-keyword">return</span> target;
}
</code></pre></div>
<ul>
<li>动态键的字典用 <code>Object.create(null)</code> 或 <code>Map</code>，没有原型链可走。</li>
<li>接口参数按 schema 校验后只取已知字段，比任何黑名单都可靠。</li>
<li>权限判断用 <code>Object.hasOwn</code> 或显式默认值，不依赖继承属性。</li>
<li><code>Object.freeze(Object.prototype)</code> 可以作为加固手段，但可能破坏会修改内置原型的第三方库，要充分测试。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>对象展开 <code>{ ...input }</code> 安全吗？展开会把 <code>__proto__</code> 作为普通自身属性复制，不会改原型，但危险键仍在，之后交给不安全的合并仍然有风险。</li>
<li>前端有多大危害？可以绕过前端的特性开关、改写模板库配置引发 XSS；最终权限仍应由服务端校验。</li>
</ul>`};export{e as default};