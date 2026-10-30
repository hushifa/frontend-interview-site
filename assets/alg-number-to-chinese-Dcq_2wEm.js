var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如把 12345 写成“一万二千三百四十五”，把 100010 写成“十万零一十”。</p>
<p>中文数字是四位一节的：个十百千为一组，组后面再加“万”“亿”。所以先把整数从右往左每 4 位切一组，每组单独按千百十个转换，再拼上组的单位。</p>
<p>真正容易错的是“零”。组内连续几个 0 只写一个零，组末尾的 0 不写；组与组之间，如果前面已经有内容、这一组又不满一千，就要在组前补一个零。整组都是 0 时，这一组连同它的“万”一起省掉，比如 100000005 是“一亿零五”。</p>
<p>还要注意“一十”。整个数以十几开头时口语省略“一”，15 读作“十五”；可“一十”出现在中间时不能省，100010 里就要写“一十”。面试时先和面试官确认支持的范围，比如是否要处理负数和小数。</p>
</blockquote>
<h2>先把整数分组</h2>
<p>中文读数是四位一节，所以 <code>123456789</code> 切成 <code>1</code>、<code>2345</code>、<code>6789</code> 三组，读作“一亿 / 二千三百四十五万 / 六千七百八十九”。每一组内部的转换方法都一样，只是后面接的单位不同。</p>
<p>下面的 <code>toChineseNumber</code> 先分组，再逐组转换。看它怎样处理几个带零的数。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-variable constant_">DIGITS</span> = <span class="hljs-string">&#x27;零一二三四五六七八九&#x27;</span>;
<span class="hljs-keyword">const</span> <span class="hljs-variable constant_">UNITS</span> = [<span class="hljs-string">&#x27;&#x27;</span>, <span class="hljs-string">&#x27;十&#x27;</span>, <span class="hljs-string">&#x27;百&#x27;</span>, <span class="hljs-string">&#x27;千&#x27;</span>];
<span class="hljs-keyword">const</span> <span class="hljs-variable constant_">GROUP_UNITS</span> = [<span class="hljs-string">&#x27;&#x27;</span>, <span class="hljs-string">&#x27;万&#x27;</span>, <span class="hljs-string">&#x27;亿&#x27;</span>];

<span class="hljs-comment">// 把不超过 4 位的数字串转成中文，zero 记录“前面有 0 还没写出来”。</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">convertGroup</span>(<span class="hljs-params">group, omitOne</span>) {
  <span class="hljs-keyword">let</span> text = <span class="hljs-string">&#x27;&#x27;</span>;
  <span class="hljs-keyword">let</span> zero = <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">const</span> digits = group.<span class="hljs-title function_">padStart</span>(<span class="hljs-number">4</span>, <span class="hljs-string">&#x27;0&#x27;</span>);
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; <span class="hljs-number">4</span>; i += <span class="hljs-number">1</span>) {
    <span class="hljs-keyword">const</span> d = <span class="hljs-title class_">Number</span>(digits[i]);
    <span class="hljs-keyword">const</span> unit = <span class="hljs-variable constant_">UNITS</span>[<span class="hljs-number">3</span> - i];
    <span class="hljs-keyword">if</span> (d === <span class="hljs-number">0</span>) {
      <span class="hljs-keyword">if</span> (text) zero = <span class="hljs-literal">true</span>;
      <span class="hljs-keyword">continue</span>;
    }
    <span class="hljs-keyword">if</span> (zero) text += <span class="hljs-variable constant_">DIGITS</span>[<span class="hljs-number">0</span>];
    zero = <span class="hljs-literal">false</span>;
    <span class="hljs-comment">// 只有整个数以“十几”开头时省略“一”。</span>
    <span class="hljs-keyword">const</span> skipOne = omitOne &amp;&amp; d === <span class="hljs-number">1</span> &amp;&amp; unit === <span class="hljs-string">&#x27;十&#x27;</span> &amp;&amp; text === <span class="hljs-string">&#x27;&#x27;</span>;
    text += (skipOne ? <span class="hljs-string">&#x27;&#x27;</span> : <span class="hljs-variable constant_">DIGITS</span>[d]) + unit;
  }
  <span class="hljs-keyword">return</span> text;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">toChineseNumber</span>(<span class="hljs-params">n</span>) {
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isSafeInteger</span>(n) || n &lt; <span class="hljs-number">0</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;只处理非负安全整数&#x27;</span>);
  <span class="hljs-keyword">const</span> intStr = <span class="hljs-title class_">String</span>(n);
  <span class="hljs-keyword">if</span> (n === <span class="hljs-number">0</span>) <span class="hljs-keyword">return</span> <span class="hljs-variable constant_">DIGITS</span>[<span class="hljs-number">0</span>];
  <span class="hljs-keyword">const</span> groups = [];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> end = intStr.<span class="hljs-property">length</span>; end &gt; <span class="hljs-number">0</span>; end -= <span class="hljs-number">4</span>) {
    groups.<span class="hljs-title function_">unshift</span>(intStr.<span class="hljs-title function_">slice</span>(<span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(<span class="hljs-number">0</span>, end - <span class="hljs-number">4</span>), end));
  }
  <span class="hljs-keyword">if</span> (groups.<span class="hljs-property">length</span> &gt; <span class="hljs-variable constant_">GROUP_UNITS</span>.<span class="hljs-property">length</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;最多 12 位&#x27;</span>);

  <span class="hljs-keyword">let</span> result = <span class="hljs-string">&#x27;&#x27;</span>;
  groups.<span class="hljs-title function_">forEach</span>(<span class="hljs-function">(<span class="hljs-params">group, i</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> value = <span class="hljs-title class_">Number</span>(group);
    <span class="hljs-keyword">if</span> (value === <span class="hljs-number">0</span>) <span class="hljs-keyword">return</span>;
    <span class="hljs-comment">// 高位已经写过内容，这一组又不满千，中间缺了位，要补一个零。</span>
    <span class="hljs-keyword">if</span> (result &amp;&amp; value &lt; <span class="hljs-number">1000</span>) result += <span class="hljs-variable constant_">DIGITS</span>[<span class="hljs-number">0</span>];
    result += <span class="hljs-title function_">convertGroup</span>(group, result === <span class="hljs-string">&#x27;&#x27;</span>);
    result += <span class="hljs-variable constant_">GROUP_UNITS</span>[groups.<span class="hljs-property">length</span> - <span class="hljs-number">1</span> - i];
  });
  <span class="hljs-keyword">return</span> result;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">toChineseNumber</span>(<span class="hljs-number">12345</span>)); <span class="hljs-comment">// 一万二千三百四十五</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">toChineseNumber</span>(<span class="hljs-number">15</span>)); <span class="hljs-comment">// 十五</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">toChineseNumber</span>(<span class="hljs-number">100010</span>)); <span class="hljs-comment">// 十万零一十</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">toChineseNumber</span>(<span class="hljs-number">100000005</span>)); <span class="hljs-comment">// 一亿零五</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">toChineseNumber</span>(<span class="hljs-number">30105000</span>)); <span class="hljs-comment">// 三千零一十万五千</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">toChineseNumber</span>(<span class="hljs-number">0</span>)); <span class="hljs-comment">// 零</span>
</code></pre></div>
<p>15 读作“十五”而不是“一十五”，因为整个数以十几开头时，口语习惯省略“一”；但 100010 里的“一十”在中间，就不能省。代码用 <code>omitOne</code> 区分这两种情况：只有在第一组、而且“十”前面还没写过任何内容时才省略。</p>
<h2>零是怎么处理的</h2>
<p>“零”的规则分两层，代码里也分两处处理。</p>
<p>第一层在组内，由 <code>convertGroup</code> 负责。逐位扫描时，遇到 0 不马上写，只把 <code>zero</code> 标记成 <code>true</code>；等后面遇到非 0 的数字，才先补一个“零”再写数字。这样连续几个 0 只会补一个零，组末尾的 0 后面没有非 0 数字，零自然就不会写出来。<code>text</code> 为空时遇到的 0 是前导零，也不标记。</p>
<p>第二层在组与组之间，由 <code>toChineseNumber</code> 负责。100010 切成 <code>10</code> 和 <code>0010</code> 两组，第二组单独转换得到“一十”，它在组内是前导零，不会补零。可是放在“十万”后面，中间缺了千位和百位，必须读出“零”。所以规则是：前面已经写过内容，而这一组的值小于 1000，就先补一个零。100000005 切成三组，中间那组 <code>0000</code> 整组是 0，直接跳过，连“万”都不写；最后一组 <code>0005</code> 小于 1000，补零，得到“一亿零五”。</p>
<p>30105000 切成 <code>3010</code> 和 <code>5000</code>。“万”这一组里的 0 在组内补成了“零”；最后一组 <code>5000</code> 不小于 1000，所以“万”和“五千”之间不补零。</p>
<h2>为什么只处理安全整数</h2>
<p><code>Number.isSafeInteger</code> 保证传进来的数能被精确表示。超过 <code>Number.MAX_SAFE_INTEGER</code> 的数字转成字符串时，末尾几位可能已经不是原来的值，转换结果也就不可信。代码同时限制最多 12 位，因为分组单位只写到“亿”；需要更大的数时，要先确认“万亿”“兆”这类单位的写法再扩展。浮点数相关的边界见<a href="/questions/js-number-bigint/">《浮点精度、安全整数和 BigInt 有哪些边界？》</a>。</p>
<h2>常见追问</h2>
<p><strong>负数和小数怎么处理？</strong></p>
<blockquote>
<p>负数先判断符号，用绝对值转换，再在前面加“负”字。小数把整数部分和小数部分拆开，整数部分照常转换，小数部分逐位读数字，中间加“点”，比如 3.05 读作“三点零五”。示例里遇到负数和小数直接抛错，避免悄悄输出错误的结果。</p>
</blockquote>
<p><strong>为什么不直接从高位往低位逐位转换？</strong></p>
<blockquote>
<p>逐位转换要自己判断每一位后面接“万”还是“亿”，还要跨组判断零，很容易漏情况。按四位分组以后，组内只有千百十个四种单位，组间只需要判断“这一组要不要补零、要不要省掉”，两层规则分开处理，代码更好写也更好测。</p>
</blockquote>`};export{e as default};