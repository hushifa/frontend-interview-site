var e={answerHtml:`<p>类型转换并不是一个统一的“猜类型”过程。同一个值放进 if、加号、减号或相等比较，走的规则可能不同。看到结果意外时，应先确认当前运算要求布尔值、数值、字符串，还是先要求一个原始值。</p>
<p>例如表单输入常常是字符串。<code>&#x27;0&#x27;</code> 在 if 中是真值，转成 Number 后却是数字 0；空字符串转成 Number 也得到 0，但业务上它可能应该表示“用户还没填”。语言转换成功，不代表业务判断就正确。</p>
<h3>布尔转换只判断真假，不分析业务含义</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Boolean</span>([])); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Boolean</span>(<span class="hljs-string">&#x27;0&#x27;</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Number</span>(<span class="hljs-string">&#x27;&#x27;</span>)); <span class="hljs-comment">// 0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-built_in">parseInt</span>(<span class="hljs-string">&#x27;12px&#x27;</span>, <span class="hljs-number">10</span>)); <span class="hljs-comment">// 12</span>
</code></pre></div>
<p>原始值中的假值包括 undefined、null、false、正负零、NaN、0n 和空字符串。非空字符串即使是 &#x27;false&#x27;、&#x27;0&#x27; 或一串空格，仍然是真值。</p>
<p>普通对象，包括空数组、空对象和 <code>new Boolean(false)</code>，也都是真值。布尔判断不会先调用对象的 valueOf 或 toString 来决定它该不该算假。浏览器中的 document.all 有历史兼容特殊行为，但不应该据此设计普通业务对象。</p>
<p>因此判断数组是否有项目应看 length，判断字段是否存在应按字段约定处理 null、undefined，判断数值有效性则需要数值规则。<code>if (value)</code> 无法替代所有这些问题：一个合法的数量 0 就会被它当作假值跳过。</p>
<h3>加号先看原始值，再决定相加还是拼接</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;5&#x27;</span> + <span class="hljs-number">2</span>); <span class="hljs-comment">// 52</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;5&#x27;</span> - <span class="hljs-number">2</span>); <span class="hljs-comment">// 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>([] + <span class="hljs-number">1</span>);  <span class="hljs-comment">// 1，字符串</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">typeof</span> ([] + <span class="hljs-number">1</span>)); <span class="hljs-comment">// string</span>
</code></pre></div>
<p>加号先把操作数转成原始值。只要结果中一方是字符串，就执行字符串拼接；否则进入数值相加的相关规则。空数组通常转成空字符串，所以 <code>[] + 1</code> 得到字符串 &#x27;1&#x27;，不是数值 1。</p>
<p>减号没有字符串拼接语义，会按数值运算要求处理操作数，因此 &#x27;5&#x27; 可以转成 5。不能从减号的结果推断加号也一定先把两边都转成数字。</p>
<p>BigInt 还需要单独考虑：两个 BigInt 可以相加，BigInt 与 Number 直接做相应混合算术通常会抛 TypeError；但与字符串的加号仍可能走拼接分支。某些原始值转换也会抛错，例如 Symbol 不能随意参与数字转换或隐式字符串拼接，不是所有失败都只会变成 NaN。</p>
<h3>对象怎样转成原始值</h3>
<p>对象可以通过 Symbol.toPrimitive 定义转换行为。回调得到的 hint 是 number、string 或 default，表示当前偏好，但返回值仍必须是原始值，再由后续运算继续处理。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> price = {
  [<span class="hljs-title class_">Symbol</span>.<span class="hljs-property">toPrimitive</span>](hint) {
    <span class="hljs-keyword">return</span> hint === <span class="hljs-string">&#x27;string&#x27;</span> ? <span class="hljs-string">&#x27;10 元&#x27;</span> : <span class="hljs-number">10</span>;
  },
};

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Number</span>(price)); <span class="hljs-comment">// 10</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">String</span>(price)); <span class="hljs-comment">// 10 元</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(price + <span class="hljs-number">2</span>); <span class="hljs-comment">// 12</span>
</code></pre></div>
<p>如果没有这个方法，普通对象通常按偏好尝试 valueOf、toString。数值或普通 default 偏好通常先试 valueOf，再试 toString；字符串偏好通常反过来。Date 等对象有自己的特殊语义，所以不能把这个顺序写成对所有对象无例外的结论。</p>
<p>尝试的方法需要返回原始值。如果一直只返回对象，就无法完成所需的原始值转换，最终会抛错。自定义方法还可以有副作用，因此一次看似简单的拼接或比较，也可能执行用户代码。</p>
<h3>Number 和 parseInt 不是同一种解析器</h3>
<p>Number 尝试把整个字符串按相应数值语法转换。它会处理前后空白，也接受指数等形式；空字符串和纯空白字符串会得到 0。无法完整按其规则解释时通常得到 NaN。</p>
<p>parseInt 则从允许的位置开始读取整数部分，遇到不符合相应进制数字的内容就停止。因此 <code>parseInt(&#x27;12px&#x27;, 10)</code> 得到 12，<code>parseInt(&#x27;1e3&#x27;, 10)</code> 得到 1，而 Number(&#x27;1e3&#x27;) 得到 1000。parseFloat 也有读取有效前缀的特点。</p>
<p>明确传进制能减少误解，但不会把 parseInt 变成“必须整个字符串都是整数”的校验函数。Number.isFinite 检查的是已经获得的 number 是否有限，也不会替你拒绝原始输入中的空白或不希望接受的格式。</p>
<h3>在业务边界先定义允许的格式</h3>
<p>假设某个数量字段只接受不带前导零的非负十进制整数，允许输入两端有空白，但不接受指数、小数或带单位的字符串，可以明确写出规则：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">parseCount</span>(<span class="hljs-params">raw</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> raw !== <span class="hljs-string">&#x27;string&#x27;</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;数量必须以字符串提供&#x27;</span>);
  }

  <span class="hljs-keyword">const</span> text = raw.<span class="hljs-title function_">trim</span>();
  <span class="hljs-keyword">if</span> (!<span class="hljs-regexp">/^(0|[1-9][0-9]*)$/</span>.<span class="hljs-title function_">test</span>(text)) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;请输入不带前导零的非负整数&#x27;</span>);
  }

  <span class="hljs-keyword">const</span> value = <span class="hljs-title class_">Number</span>(text);
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isSafeInteger</span>(value)) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;数量超出安全整数范围&#x27;</span>);
  }
  <span class="hljs-keyword">return</span> value;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">parseCount</span>(<span class="hljs-string">&#x27; 12 &#x27;</span>)); <span class="hljs-comment">// 12</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">parseCount</span>(<span class="hljs-string">&#x27;0&#x27;</span>)); <span class="hljs-comment">// 0</span>
</code></pre></div>
<p>这份函数有意拒绝空字符串、&#x27;01&#x27;、&#x27;12px&#x27;、&#x27;1e3&#x27;、负数和超出安全整数范围的值。不是说这些格式永远不合法，而是它们不属于本例的接口约定。若业务需要前导零标识、金额、本地化小数或超大整数，应换成相应的字符串、十进制或 BigInt 方案。</p>
<p>关键是在数据进入系统时明确处理一次，后面的业务代码使用统一类型。不要一会儿依赖宽松相等，一会儿靠 truthy 判断，一会儿又用 parseInt 截掉后缀，最终让同一个输入在不同位置得到不同含义。</p>`};export{e as default};