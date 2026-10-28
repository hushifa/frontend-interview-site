var e={answerHtml:`<p>一个工具库的泛型类型可能在简单示例中看起来正确，但当消费者传入联合类型、只读对象、重载参数或错误输入时，推导结果才会暴露问题。只运行 JavaScript 测试，无法发现“本来应该报错的代码突然被允许”或“合法调用丢失了精确返回类型”。</p>
<p>类型测试验证编译器看到的契约；运行时测试验证真正执行的 JavaScript。两者必须分开，因为 TypeScript 类型会在构建后消失，不能替代输入校验和业务测试。</p>
<h2>正向用例验证推导结果</h2>
<p>假设库提供一个保留输入类型的 <code>wrap</code> 函数：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> wrap&lt;T&gt;(<span class="hljs-attr">value</span>: T): { <span class="hljs-attr">value</span>: T } {
  <span class="hljs-keyword">return</span> { value };
}
</code></pre></div>
<p>可以在专门的类型测试文件中验证结果是否仍然精确：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">const</span> numberBox = <span class="hljs-title function_">wrap</span>(<span class="hljs-number">1</span>);
<span class="hljs-keyword">const</span> literalBox = <span class="hljs-title function_">wrap</span>(<span class="hljs-string">&#x27;ready&#x27;</span> <span class="hljs-keyword">as</span> <span class="hljs-keyword">const</span>);

<span class="hljs-keyword">const</span> <span class="hljs-attr">numberValue</span>: <span class="hljs-built_in">number</span> = numberBox.<span class="hljs-property">value</span>;
<span class="hljs-keyword">const</span> <span class="hljs-attr">literalValue</span>: <span class="hljs-string">&#x27;ready&#x27;</span> = literalBox.<span class="hljs-property">value</span>;
<span class="hljs-built_in">void</span> numberValue;
<span class="hljs-built_in">void</span> literalValue;
</code></pre></div>
<p>如果 <code>wrap</code> 被错误改成返回 <code>{ value: unknown }</code>，第二类赋值会报错；如果类型过度扩大为 <code>string</code>，字面量 <code>ready</code> 的精确关系会丢失。把这些代码放进与发布配置一致的 <code>tsc --noEmit</code> 检查中，才能验证消费者实际看到的声明。</p>
<p>正向赋值也要覆盖 readonly、联合、可选属性和真实导出入口。只在源码文件旁边测试，可能绕过 package <code>exports</code>、<code>.d.ts</code> 生成和安装后的模块解析。</p>
<h2>负向用例要确认错误确实存在</h2>
<p><code>@ts-expect-error</code> 可以表达“下一行应该报类型错误”：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// @ts-expect-error 字符串返回值不能赋给 number</span>
<span class="hljs-keyword">const</span> <span class="hljs-attr">impossible</span>: <span class="hljs-built_in">number</span> = <span class="hljs-title function_">wrap</span>(<span class="hljs-string">&#x27;text&#x27;</span>).<span class="hljs-property">value</span>;
</code></pre></div>
<p>不过注释放错位置、错误原因来自别的行，或者编译器配置变宽，都可能让测试失去意义。<code>@ts-expect-error</code> 在下一行没有错误时还会报错，这正好能防止一个本来应该拒绝的调用悄悄变成合法；但它不能证明错误是你期待的那一种，必要时应使用更精确的类型断言工具。</p>
<p>不要把 <code>@ts-ignore</code> 当成负向测试。它会无条件吞掉诊断，类型 API 退化后测试仍可能通过。公共库应尽量把错误调用写成可读的类型用例，并在评审中说明为什么必须拒绝。</p>
<p>正向赋值只验证可赋值关系，不自动证明类型完全相等。特别是 any 可以通过很多赋值测试，所以不能只看到 numberValue 编译成功就断言返回类型精确。可以增加专门的退化检测：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">IsAny</span>&lt;T&gt; = <span class="hljs-number">0</span> <span class="hljs-title function_">extends</span> (<span class="hljs-number">1</span> &amp; T) ? <span class="hljs-literal">true</span> : <span class="hljs-literal">false</span>;
<span class="hljs-keyword">type</span> <span class="hljs-title class_">AssertFalse</span>&lt;T <span class="hljs-keyword">extends</span> <span class="hljs-literal">false</span>&gt; = T;
<span class="hljs-keyword">type</span> <span class="hljs-title class_">NumberBoxMustNotBeAny</span> = <span class="hljs-title class_">AssertFalse</span>&lt;<span class="hljs-title class_">IsAny</span>&lt;<span class="hljs-keyword">typeof</span> numberBox.<span class="hljs-property">value</span>&gt;&gt;;
</code></pre></div>
<p>如果接口退化为 any，这个断言会失败。它只针对 any 这一种问题，不是通用的类型等价证明；复杂泛型还需要有针对性的正负用例。解释 @ts-expect-error 时也应写出实际预期错误，而不是靠一个无关的拼写错误让下一行满足“存在诊断”。</p>
<h2>satisfies、as 和类型断言的测试意义不同</h2>
<p><code>satisfies</code> 可以检查表达式符合某个约束，同时尽量保留表达式自身的推导类型；<code>as</code> 则是告诉编译器按指定类型看待，可能掩盖真实不匹配。类型测试中应优先使用赋值、泛型辅助和 <code>satisfies</code> 表达约束，不要用一串断言把错误强行变绿。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">const</span> routes = {
  <span class="hljs-attr">home</span>: <span class="hljs-string">&#x27;/&#x27;</span>,
  <span class="hljs-attr">profile</span>: <span class="hljs-string">&#x27;/profile&#x27;</span>,
} <span class="hljs-keyword">as</span> <span class="hljs-keyword">const</span> <span class="hljs-keyword">satisfies</span> <span class="hljs-title class_">Record</span>&lt;<span class="hljs-built_in">string</span>, <span class="hljs-string">\`/<span class="hljs-subst">\${<span class="hljs-built_in">string</span>}</span>\`</span>&gt;;

<span class="hljs-keyword">const</span> <span class="hljs-attr">home</span>: <span class="hljs-string">&#x27;/&#x27;</span> = routes.<span class="hljs-property">home</span>;
<span class="hljs-built_in">void</span> home;
</code></pre></div>
<p>如果把 <code>profile</code> 写成不符合约束的字符串，<code>satisfies</code> 应该报错；如果只写 <code>as Record&lt;string, string&gt;</code>，可能失去字面量和格式约束。测试辅助函数也要保持无运行时副作用，避免类型检查文件被误当成生产代码执行。</p>
<h2>重载和条件类型要测试边界组合</h2>
<p>一个重载 API 至少要覆盖每个公开签名、联合变量和不应允许的参数：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">declare</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">parse</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">string</span></span>): <span class="hljs-built_in">number</span>;
<span class="hljs-keyword">declare</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">parse</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">number</span></span>): <span class="hljs-built_in">string</span>;

<span class="hljs-keyword">const</span> <span class="hljs-attr">fromText</span>: <span class="hljs-built_in">number</span> = <span class="hljs-title function_">parse</span>(<span class="hljs-string">&#x27;42&#x27;</span>);
<span class="hljs-keyword">const</span> <span class="hljs-attr">fromNumber</span>: <span class="hljs-built_in">string</span> = <span class="hljs-title function_">parse</span>(<span class="hljs-number">42</span>);
<span class="hljs-keyword">const</span> <span class="hljs-attr">input</span>: <span class="hljs-built_in">string</span> | <span class="hljs-built_in">number</span> = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">random</span>() &gt; <span class="hljs-number">0.5</span> ? <span class="hljs-string">&#x27;42&#x27;</span> : <span class="hljs-number">42</span>;

<span class="hljs-comment">// @ts-expect-error 没有公开的联合参数签名</span>
<span class="hljs-keyword">const</span> ambiguous = <span class="hljs-title function_">parse</span>(input);
<span class="hljs-built_in">void</span> fromText;
<span class="hljs-built_in">void</span> fromNumber;
<span class="hljs-built_in">void</span> ambiguous;
</code></pre></div>
<p>如果产品确实需要接受联合变量，就应修改公共 API 或增加正确的联合签名，并更新测试；不要为了让测试通过而给实现加 <code>any</code>。条件类型、映射类型和递归类型还要测试 <code>never</code>、<code>unknown</code>、可选属性、readonly 和深层嵌套，防止分支只在简单对象上成立。</p>
<h2>类型测试和运行时测试不能互相替代</h2>
<p>类型测试通过只证明编译器接受或拒绝了某些程序。它不证明 <code>JSON.parse</code> 返回的对象符合类型，也不证明字符串、数字和日期在运行时满足业务约束。网络、localStorage、跨窗口消息和用户输入仍需 schema 解析和运行时测试。</p>
<p>反过来，运行时测试传入一个合法 JavaScript 对象，也不一定发现公共 <code>.d.ts</code> 把返回值声明错了。库项目应在独立消费者中运行类型测试和运行时测试，并检查打包产物、ESM/CJS 入口、声明文件和 <code>exports</code> 条件。</p>
<h2>类型测试要与版本和配置绑定</h2>
<p><code>strict</code>、<code>exactOptionalPropertyTypes</code>、<code>noUncheckedIndexedAccess</code>、<code>moduleResolution</code> 和 TypeScript 版本都会影响诊断。类型测试必须使用项目支持的配置，否则本地通过不代表消费者环境也通过。</p>
<p>升级 TypeScript 或依赖后，先查看新增/消失的诊断，再决定是修复类型、更新契约还是明确调整支持范围。不要把所有类型测试都关掉，或把整个测试目录排除在 <code>tsconfig</code> 外来解决升级冲突。</p>
<p>一个好的类型测试集不追求覆盖每种语法，而是锁定公共 API 最重要的关系：输入与输出、合法与非法调用、重载分支、错误消息类型和安装后导出。它与运行时、集成和端到端测试配合，才能证明库既容易正确使用，又能在真实环境中执行。</p>`};export{e as default};