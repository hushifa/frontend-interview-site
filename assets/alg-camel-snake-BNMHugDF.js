var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>后端接口返回 <code>{ user_name: &#x27;小明&#x27; }</code>，前端代码习惯写 <code>userName</code>，所以请求回来要把 key 全转成驼峰，提交时再转回下划线。</p>
<p>单个字符串的转换靠正则替换。<code>user_name</code> 转驼峰，匹配“下划线后面跟一个字母”，把它换成这个字母的大写；<code>userName</code> 转下划线，匹配每个大写字母，换成“下划线加小写字母”。<code>replace</code> 的第二个参数可以是函数，匹配到的内容会传进来，返回值就是替换结果。</p>
<p>对象的 key 要深度转换，因为接口数据常常是对象里套数组、数组里套对象。递归处理：数组就逐项转换，普通对象就转换每个 key，再递归处理它的值，其他值原样返回。</p>
<p>要注意“普通对象”的判断。<code>typeof</code> 对 <code>Date</code>、<code>null</code> 都返回 <code>&#x27;object&#x27;</code>，如果当成普通对象去遍历 key，<code>Date</code> 会变成空对象。所以要用原型判断，只处理原型是 <code>Object.prototype</code> 或 <code>null</code> 的对象。另外连续大写字母，比如 <code>userID</code>，简单正则会转成 <code>user_i_d</code>，需要的话要单独处理。</p>
</blockquote>
<h2>字符串互转</h2>
<p>下面两个函数都用 <code>replace</code> 加替换函数，<code>g</code> 标志表示替换所有匹配。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-title function_">toCamel</span> = (<span class="hljs-params">text</span>) =&gt; text.<span class="hljs-title function_">replace</span>(<span class="hljs-regexp">/_([a-z])/g</span>, <span class="hljs-function">(<span class="hljs-params">_, letter</span>) =&gt;</span> letter.<span class="hljs-title function_">toUpperCase</span>());
<span class="hljs-keyword">const</span> <span class="hljs-title function_">toSnake</span> = (<span class="hljs-params">text</span>) =&gt; text.<span class="hljs-title function_">replace</span>(<span class="hljs-regexp">/[A-Z]/g</span>, <span class="hljs-function">(<span class="hljs-params">letter</span>) =&gt;</span> <span class="hljs-string">\`_<span class="hljs-subst">\${letter.toLowerCase()}</span>\`</span>);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">isPlainObject</span>(<span class="hljs-params">value</span>) {
  <span class="hljs-keyword">if</span> (value === <span class="hljs-literal">null</span> || <span class="hljs-keyword">typeof</span> value !== <span class="hljs-string">&#x27;object&#x27;</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">const</span> proto = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">getPrototypeOf</span>(value);
  <span class="hljs-keyword">return</span> proto === <span class="hljs-title class_">Object</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span> || proto === <span class="hljs-literal">null</span>;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">convertKeys</span>(<span class="hljs-params">value, convert</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-title class_">Array</span>.<span class="hljs-title function_">isArray</span>(value)) <span class="hljs-keyword">return</span> value.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> <span class="hljs-title function_">convertKeys</span>(item, convert));
  <span class="hljs-keyword">if</span> (!<span class="hljs-title function_">isPlainObject</span>(value)) <span class="hljs-keyword">return</span> value;
  <span class="hljs-keyword">const</span> result = {};
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> [key, child] <span class="hljs-keyword">of</span> <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">entries</span>(value)) {
    result[<span class="hljs-title function_">convert</span>(key)] = <span class="hljs-title function_">convertKeys</span>(child, convert);
  }
  <span class="hljs-keyword">return</span> result;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">toCamel</span>(<span class="hljs-string">&#x27;user_first_name&#x27;</span>)); <span class="hljs-comment">// userFirstName</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">toSnake</span>(<span class="hljs-string">&#x27;userFirstName&#x27;</span>)); <span class="hljs-comment">// user_first_name</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">toSnake</span>(<span class="hljs-string">&#x27;userID&#x27;</span>)); <span class="hljs-comment">// user_i_d</span>

<span class="hljs-keyword">const</span> response = {
  <span class="hljs-attr">user_id</span>: <span class="hljs-number">1</span>,
  <span class="hljs-attr">order_list</span>: [{ <span class="hljs-attr">order_no</span>: <span class="hljs-string">&#x27;A1&#x27;</span>, <span class="hljs-attr">created_at</span>: <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(<span class="hljs-number">0</span>) }],
};
<span class="hljs-keyword">const</span> data = <span class="hljs-title function_">convertKeys</span>(response, toCamel);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(data).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// userId,orderList</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(data.<span class="hljs-property">orderList</span>[<span class="hljs-number">0</span>]).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// orderNo,createdAt</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(data.<span class="hljs-property">orderList</span>[<span class="hljs-number">0</span>].<span class="hljs-property">createdAt</span> <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">Date</span>); <span class="hljs-comment">// true</span>
</code></pre></div>
<p><code>toCamel</code> 的替换函数为什么写成 <code>(_, letter) =&gt; ...</code>？替换函数的第一个参数是整个匹配到的内容，比如 <code>&#x27;_f&#x27;</code>，后面依次是各个捕获组。正则里用括号捕获了下划线后面的字母，所以第二个参数 <code>letter</code> 就是 <code>&#x27;f&#x27;</code>，转成大写返回，下划线就跟着被替换掉了。</p>
<p><code>toSnake(&#x27;userID&#x27;)</code> 得到 <code>user_i_d</code>，因为正则把 <code>I</code> 和 <code>D</code> 当成两个单独的大写字母。lodash 的 <code>_.snakeCase(&#x27;userID&#x27;)</code> 会得到 <code>user_id</code>，它先按单词拆分，把连续的大写字母当成一个词。如果接口里有这类缩写，可以改成先匹配连续大写字母，或者直接用 lodash。</p>
<h2>为什么要判断普通对象</h2>
<p><code>created_at</code> 的值是一个 <code>Date</code>。如果判断条件只写 <code>typeof value === &#x27;object&#x27;</code>，<code>Date</code> 也会进入遍历分支。<code>Object.entries(new Date())</code> 是空数组，结果就变成了 <code>{}</code>，日期信息全丢了。</p>
<p>所以 <code>isPlainObject</code> 看的是原型：字面量 <code>{}</code> 创建的对象，原型是 <code>Object.prototype</code>；<code>Object.create(null)</code> 创建的对象，原型是 <code>null</code>。这两种才逐个转换 key，<code>Date</code>、<code>Map</code>、类的实例都原样保留。最后一行输出 <code>true</code>，说明转换后它还是 <code>Date</code>。</p>
<h2>常见追问</h2>
<p><strong>会不会有循环引用导致无限递归？</strong></p>
<blockquote>
<p>接口返回的 JSON 不会有循环引用，因为 JSON 本身表示不了。如果要转换的是任意对象，就要像深拷贝那样用 <code>WeakMap</code> 记录已经处理过的对象，见<a href="/questions/alg-deep-clone/">《怎样手写深拷贝？和 structuredClone 有什么区别？》</a>。</p>
</blockquote>
<p><strong>转换后两个 key 撞在一起怎么办？</strong></p>
<blockquote>
<p>比如同时有 <code>user_name</code> 和 <code>userName</code>，转成驼峰后都是 <code>userName</code>，后处理的会覆盖先处理的。这种数据说明接口命名本身不一致，应该和后端约定好一种风格，而不是靠转换函数兜底。</p>
</blockquote>`};export{e as default};