var e={answerHtml:`<p>普通对象读取属性时，如果自己没有这个属性，就会沿原型链继续查找。原型污染利用的正是这个机制：攻击者不必逐个修改业务对象，只要让不安全的代码把属性写进共享原型，其他对象就可能在读取时“继承”到攻击者的值。</p>
<h3>一次动态赋值怎样写到共享原型</h3>
<p>下面是刻意保留漏洞的演示，只应在独立测试环境运行：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> record = {};
<span class="hljs-keyword">const</span> group = <span class="hljs-string">&#x27;__proto__&#x27;</span>;
<span class="hljs-keyword">const</span> field = <span class="hljs-string">&#x27;demoPermission&#x27;</span>;

<span class="hljs-keyword">try</span> {
  record[group][field] = <span class="hljs-string">&#x27;admin&#x27;</span>;
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">hasOwn</span>(record, <span class="hljs-string">&#x27;demoPermission&#x27;</span>)); <span class="hljs-comment">// false</span>
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(({}).<span class="hljs-property">demoPermission</span>); <span class="hljs-comment">// admin</span>
} <span class="hljs-keyword">finally</span> {
  <span class="hljs-keyword">delete</span> <span class="hljs-title class_">Object</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>.<span class="hljs-property">demoPermission</span>;
}
</code></pre></div>
<p><code>record[&#x27;__proto__&#x27;]</code> 在这里访问到的是 <code>Object.prototype</code>，所以后续赋值实际修改了共享原型。新建的空对象没有自己的 demoPermission，但读取时能从原型上找到它。</p>
<p>真实漏洞中，group 和 field 往往来自查询参数、配置文件或递归合并的路径。代码可能本来只想支持“按用户指定字段更新设置”，却没有限制它可以走到哪里。</p>
<p>屏蔽 <code>__proto__</code> 一种名称也不够。对普通对象，<code>record[&#x27;constructor&#x27;][&#x27;prototype&#x27;]</code> 同样可以到达 Object.prototype。深合并若直接读取目标上的继承属性，再继续递归写入，也可能把数据合并进原型。</p>
<h3>JSON.parse 本身与后续合并要分开看</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> input = <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(<span class="hljs-string">&#x27;{&quot;__proto__&quot;:{&quot;preview&quot;:true}}&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">hasOwn</span>(input, <span class="hljs-string">&#x27;__proto__&#x27;</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(({}).<span class="hljs-property">preview</span>); <span class="hljs-comment">// undefined</span>

<span class="hljs-keyword">const</span> assigned = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">assign</span>({}, input);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(assigned.<span class="hljs-property">preview</span>); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">hasOwn</span>(assigned, <span class="hljs-string">&#x27;preview&#x27;</span>)); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(({}).<span class="hljs-property">preview</span>); <span class="hljs-comment">// undefined</span>

<span class="hljs-keyword">const</span> spread = { ...input };
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">hasOwn</span>(spread, <span class="hljs-string">&#x27;__proto__&#x27;</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">getPrototypeOf</span>(spread) === <span class="hljs-title class_">Object</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(spread.<span class="hljs-property">preview</span>); <span class="hljs-comment">// undefined</span>
</code></pre></div>
<p>JSON.parse 只是创建了名为 <code>__proto__</code> 的自身属性。随后 Object.assign 对普通目标对象执行赋值，可能触发继承的 <code>__proto__</code> setter，把<strong>目标对象自己的原型</strong>换掉；这个示例并没有污染全局的 Object.prototype。</p>
<p>对象展开使用创建自身属性的语义，不触发同一种 setter，所以这里不会改写 spread 的原型。但这不意味着展开后的数据已经安全：危险键还在，后续再交给不安全的深合并函数，风险仍可能出现。</p>
<h3>为什么会影响权限和配置</h3>
<p>例如代码把 <code>if (user.isAdmin)</code> 当作权限依据，而普通用户对象没有自己的 isAdmin 属性。若原型被污染出 <code>isAdmin: true</code>，条件就可能错误成立。配置对象也有类似问题：原本未指定的选项可能意外读取到继承值。</p>
<p>处理权限时，除了确保实际授权由服务端完成，还应使用明确的数据结构和默认值。只接受自身属性的读取可以用 Object.hasOwn，但它解决的是某个读取点的问题，不能修复其他位置仍在污染原型的写入。</p>
<h3>防御应优先缩小可以写入的范围</h3>
<p>业务只允许设置主题和每页数量，就应校验并显式提取这两个字段，不必提供任意路径深合并功能。对于必须接收复杂对象的接口，使用 schema 限制字段、类型和嵌套结构，拒绝未知键，并核对合并库的安全版本。</p>
<p>如果业务真正需要的是任意字符串键的字典，可以用 Map；或者用 <code>Object.create(null)</code> 创建无原型对象。后者没有继承的 <code>__proto__</code> setter，但不能保证之后把它复制进普通对象时依然安全。多层字典的每一层也都需要正确处理，不能只把最外层换成无原型对象。</p>
<p>另外，遍历外部对象时优先明确使用自身键，例如 Object.keys；<code>for...in</code> 会枚举可枚举的继承属性，可能把已经污染的字段继续传播。修复应同时检查“哪里能写入原型”和“哪里会把继承值当成可信配置”，而不是只做一次字符串替换。</p>`};export{e as default};