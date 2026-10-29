var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>普通对象读不到自己的属性时，会去它的原型 <code>Object.prototype</code> 上找，而所有普通对象共用这一个原型。<code>obj[&#x27;__proto__&#x27;]</code> 拿到的正是这个共享原型，如果再往上面赋值，所有对象就都“继承”了这个值，这就是原型污染。</p>
<p>它常出现在属性名由外部输入决定的地方。比如按路径设置值的工具函数、递归的深合并、把查询字符串解析成嵌套对象。攻击者只要让某个键是 <code>__proto__</code>，就能一路写到共享原型上。</p>
<p>后果是 <code>if (user.isAdmin)</code> 这类读继承属性的判断会被绕过，或者配置默认值被篡改，在 Node 里还可能进一步导致代码执行。</p>
<p>防御上，拒绝 <code>__proto__</code>、<code>constructor</code>、<code>prototype</code> 这几个键；动态键用 <code>Object.create(null)</code> 或 <code>Map</code> 存；更可靠的是按 schema 只取已知字段。要注意，<code>JSON.parse</code> 本身不会污染，危险发生在之后交给不安全的合并逻辑。</p>
</blockquote>
<h2>先看一个例子</h2>
<p>下面直接用 <code>__proto__</code> 作为键赋值，然后看一个全新的空对象能读到什么：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> record = {};
record[<span class="hljs-string">&#x27;__proto__&#x27;</span>][<span class="hljs-string">&#x27;demoPermission&#x27;</span>] = <span class="hljs-string">&#x27;admin&#x27;</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">hasOwn</span>(record, <span class="hljs-string">&#x27;demoPermission&#x27;</span>)); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>({}.<span class="hljs-property">demoPermission</span>); <span class="hljs-comment">// admin</span>
<span class="hljs-keyword">delete</span> <span class="hljs-title class_">Object</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>.<span class="hljs-property">demoPermission</span>;
</code></pre></div>
<p><code>record</code> 自己身上并没有 <code>demoPermission</code>，可一个跟它毫无关系的 <code>{}</code> 却读到了 <code>admin</code>。原因是 <code>record[&#x27;__proto__&#x27;]</code> 就是 <code>Object.prototype</code>，第二步赋值实际改的是所有对象共享的原型。最后一行把它删掉，是为了不影响后面的代码。</p>
<h2>深合并是怎么被利用的</h2>
<p>真实代码里很少有人直接写 <code>obj[&#x27;__proto__&#x27;]</code>，更常见的是一个通用的深合并函数：</p>
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
<p>先看第一个输出，<code>JSON.parse</code> 之后 <code>{}.preview</code> 还是 <code>undefined</code>。因为 <code>JSON.parse</code> 遇到 <code>__proto__</code> 只会创建一个名字叫 <code>__proto__</code> 的普通自身属性，不会改原型。</p>
<p>问题出在合并。<code>Object.keys(input)</code> 会列出 <code>__proto__</code> 这个键，合并函数接着读 <code>target[&#x27;__proto__&#x27;]</code>。对普通对象来说，这个读取拿到的是 <code>Object.prototype</code>，它不是 <code>null</code>，<code>??=</code> 不会替换它，于是下一层递归就往 <code>Object.prototype</code> 上写了 <code>preview: true</code>。</p>
<h2>怎么改</h2>
<p>改法是遇到危险的键直接跳过，并且只在目标自己身上有对象时才往下递归：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-variable constant_">BLOCKED</span> = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>([<span class="hljs-string">&#x27;__proto__&#x27;</span>, <span class="hljs-string">&#x27;constructor&#x27;</span>, <span class="hljs-string">&#x27;prototype&#x27;</span>]);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">safeMerge</span>(<span class="hljs-params">target, source</span>) {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> key <span class="hljs-keyword">of</span> <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(source)) {
    <span class="hljs-keyword">if</span> (<span class="hljs-variable constant_">BLOCKED</span>.<span class="hljs-title function_">has</span>(key)) <span class="hljs-keyword">continue</span>;
    <span class="hljs-keyword">const</span> value = source[key];
    <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> value === <span class="hljs-string">&#x27;object&#x27;</span> &amp;&amp; value !== <span class="hljs-literal">null</span> &amp;&amp; !<span class="hljs-title class_">Array</span>.<span class="hljs-title function_">isArray</span>(value)) {
      <span class="hljs-comment">// 目标缺少该键或是原始值时，换成新对象再递归</span>
      <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">hasOwn</span>(target, key) || <span class="hljs-keyword">typeof</span> target[key] !== <span class="hljs-string">&#x27;object&#x27;</span> || target[key] === <span class="hljs-literal">null</span>) {
        target[key] = {};
      }
      <span class="hljs-title function_">safeMerge</span>(target[key], value);
    } <span class="hljs-keyword">else</span> {
      target[key] = value;
    }
  }
  <span class="hljs-keyword">return</span> target;
}
</code></pre></div>
<p>为什么 <code>constructor</code> 和 <code>prototype</code> 也要拦？因为 <code>obj.constructor.prototype</code> 同样指向 <code>Object.prototype</code>，攻击者可以绕一圈走这条路。</p>
<p>黑名单之外还有更根本的办法。存放动态键的字典用 <code>Object.create(null)</code> 或 <code>Map</code>，它们没有原型链可走，<code>__proto__</code> 在里面只是一个普通的键。接口参数按 schema 校验后只取已知字段，比任何黑名单都可靠。权限判断用 <code>Object.hasOwn</code> 或显式的默认值，不依赖继承来的属性。</p>
<p>还可以用 <code>Object.freeze(Object.prototype)</code> 加固，让原型根本改不了。可是有些第三方库会修改内置原型，冻结后可能出问题，要充分测试。</p>
<h2>常见追问</h2>
<p><strong>对象展开 <code>{ ...input }</code> 安全吗？</strong></p>
<blockquote>
<p>展开本身不会改原型，它会把 <code>__proto__</code> 当作普通的自身属性复制过来。可是危险的键还在新对象里，之后交给不安全的合并函数，照样会污染。</p>
</blockquote>
<p><strong>前端的原型污染危害有多大？</strong></p>
<blockquote>
<p>可以绕过前端的特性开关，或者改写模板库的配置引发 XSS。不过最终的权限判断应该在服务端做，前端的判断被绕过不应该直接造成越权。</p>
</blockquote>`};export{e as default};