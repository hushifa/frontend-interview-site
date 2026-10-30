var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>拿一个数组 <code>[&#x27;a&#x27;, &#x27;b&#x27;]</code> 来说，<code>for...in</code> 拿到的是键 <code>&#x27;0&#x27;</code>、<code>&#x27;1&#x27;</code>，而且是字符串；<code>for...of</code> 拿到的是值 <code>&#x27;a&#x27;</code>、<code>&#x27;b&#x27;</code>；<code>forEach</code> 和 <code>map</code> 是数组方法，对每个元素调用一次回调，区别是 <code>forEach</code> 返回 <code>undefined</code>，<code>map</code> 返回由回调返回值组成的新数组。</p>
<p>它们的来源不同。<code>for...in</code> 走的是属性枚举，会遍历对象自己和原型链上可枚举的字符串键，所以适合普通对象，不适合数组。<code>for...of</code> 走的是迭代器，数组、字符串、<code>Map</code>、<code>Set</code>、<code>NodeList</code> 都能用，普通对象不行。</p>
<p>选的时候看要做什么：遍历对象的键用 <code>Object.keys</code> 或 <code>for...in</code>；要转换成新数组用 <code>map</code>；只是挨个做点事用 <code>forEach</code> 或 <code>for...of</code>；要中途停下或者要 <code>await</code>，用 <code>for...of</code>。</p>
<p><code>forEach</code> 不能用 <code>break</code>，写在回调里是语法错误，<code>return</code> 也只是结束这一次回调。MDN 写明，除了抛异常，没有办法停止 <code>forEach</code>。要提前结束，就改用 <code>for...of</code> 加 <code>break</code>，或者用 <code>some</code>、<code>find</code> 这类找到就停的方法。</p>
</blockquote>
<h2>同一个数组，四种写法拿到什么</h2>
<p>下面给数组加了一个非下标属性 <code>extra</code>，再在 <code>Array.prototype</code> 上加一个可枚举的方法，看看每种写法会碰到哪些东西。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> list = [<span class="hljs-string">&#x27;a&#x27;</span>, <span class="hljs-string">&#x27;b&#x27;</span>];
list.<span class="hljs-property">extra</span> = <span class="hljs-string">&#x27;x&#x27;</span>;
<span class="hljs-title class_">Array</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>.<span class="hljs-property">hello</span> = <span class="hljs-keyword">function</span> (<span class="hljs-params"></span>) {};

<span class="hljs-keyword">const</span> inKeys = [];
<span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> key <span class="hljs-keyword">in</span> list) inKeys.<span class="hljs-title function_">push</span>(key);
<span class="hljs-keyword">const</span> ofValues = [];
<span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> value <span class="hljs-keyword">of</span> list) ofValues.<span class="hljs-title function_">push</span>(value);
<span class="hljs-keyword">const</span> eachResult = list.<span class="hljs-title function_">forEach</span>(<span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> value.<span class="hljs-title function_">toUpperCase</span>());
<span class="hljs-keyword">const</span> mapResult = list.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> value.<span class="hljs-title function_">toUpperCase</span>());

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(inKeys.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 0,1,extra,hello</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">typeof</span> inKeys[<span class="hljs-number">0</span>]); <span class="hljs-comment">// string</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(ofValues.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// a,b</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">String</span>(eachResult)); <span class="hljs-comment">// undefined</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(mapResult.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// A,B</span>

<span class="hljs-keyword">delete</span> <span class="hljs-title class_">Array</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>.<span class="hljs-property">hello</span>;
</code></pre></div>
<p><code>for...in</code> 拿到了四个键，除了下标，还有 <code>extra</code> 和原型上的 <code>hello</code>。因为它遍历的是可枚举属性，下标只是名字恰好是整数的属性，和 <code>extra</code> 没有区别，原型链上可枚举的属性也会被带上。下标拿到的是字符串 <code>&#x27;0&#x27;</code>，拿去做加法会变成字符串拼接。所以 MDN 建议遍历数组用普通 <code>for</code> 循环、<code>forEach</code> 或 <code>for...of</code>。</p>
<p><code>for...of</code> 只拿到 <code>a</code>、<code>b</code>。它不看属性，而是调用数组的迭代器，数组的迭代器只按下标产出元素。</p>
<p><code>forEach</code> 把回调的返回值丢掉，自己返回 <code>undefined</code>。<code>map</code> 收集每次的返回值，组成新数组。只为了副作用而调用 <code>map</code>，会白白造一个数组，这种时候用 <code>forEach</code> 或 <code>for...of</code>。</p>
<h2>为什么 forEach 停不下来</h2>
<p><code>break</code> 和 <code>continue</code> 只能写在循环语句里。<code>forEach</code> 的回调是一个普通函数，不是循环体，所以在回调里写 <code>break</code> 会直接报语法错误。在回调里 <code>return</code>，只是让这一次回调结束，<code>forEach</code> 会接着调用下一个元素。</p>
<p>MDN 的说法是：除了抛出异常，没有办法停止或跳出 <code>forEach</code>，需要这种行为时，<code>forEach</code> 就不是合适的工具。用 <code>try</code>/<code>catch</code> 包住再 <code>throw</code> 虽然能停，但读代码的人很难看出意图。下面是更直接的写法：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> numbers = [<span class="hljs-number">3</span>, <span class="hljs-number">8</span>, <span class="hljs-number">12</span>, <span class="hljs-number">5</span>];

<span class="hljs-keyword">let</span> firstBig;
<span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> n <span class="hljs-keyword">of</span> numbers) {
  <span class="hljs-keyword">if</span> (n &gt; <span class="hljs-number">10</span>) {
    firstBig = n;
    <span class="hljs-keyword">break</span>;
  }
}

<span class="hljs-keyword">const</span> checked = [];
<span class="hljs-keyword">const</span> hasBig = numbers.<span class="hljs-title function_">some</span>(<span class="hljs-function">(<span class="hljs-params">n</span>) =&gt;</span> {
  checked.<span class="hljs-title function_">push</span>(n);
  <span class="hljs-keyword">return</span> n &gt; <span class="hljs-number">10</span>;
});

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(firstBig); <span class="hljs-comment">// 12</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">String</span>(hasBig)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(checked.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 3,8,12</span>
</code></pre></div>
<p><code>for...of</code> 遇到 12 就 <code>break</code> 出去了。<code>some</code> 也一样，回调返回 <code>true</code> 以后就不再往后调用，从 <code>checked</code> 能看到最后一个 5 没有被检查。只想拿到第一个满足条件的元素，用 <code>find</code> 更短。</p>
<h2>还有哪些差别</h2>
<p><code>forEach</code> 和 <code>map</code> 会跳过稀疏数组里的空位，<code>for...of</code> 会把空位读成 <code>undefined</code>，<code>for...in</code> 也会跳过空位。稀疏数组的问题见<a href="/questions/js-array-iteration/">《数组常用方法怎样选择，哪些会修改原数组？》</a>。</p>
<p><code>forEach</code> 不会等待 <code>async</code> 回调，MDN 写明它期望的是同步函数。要一个一个等，用 <code>for...of</code> 加 <code>await</code>；要一起跑再等全部完成，用 <code>map</code> 收集 Promise 再交给 <code>Promise.all</code>。</p>
<p><code>for...of</code> 中途 <code>break</code> 或抛出异常时，会调用迭代器的 <code>return()</code> 方法做清理，见<a href="/questions/js-iterator-closing/">《JavaScript 迭代器关闭和 return 方法有什么作用？》</a>。<code>for...in</code> 的键顺序和各个取键方法的范围，见<a href="/questions/js-property-enumeration/">《Object.keys、for...in 和 Reflect.ownKeys 会返回哪些属性？》</a>。</p>
<h2>常见追问</h2>
<p><strong><code>for...of</code> 能遍历普通对象吗？</strong></p>
<blockquote>
<p>不能，普通对象没有实现迭代器，会抛出 TypeError。要遍历键值对，写 <code>for (const [key, value] of Object.entries(obj))</code>。</p>
</blockquote>
<p><strong><code>forEach</code> 里用 <code>return</code> 有什么效果？</strong></p>
<blockquote>
<p>只结束当前这一次回调，相当于普通循环里的 <code>continue</code>。后面的元素还会继续被调用，<code>forEach</code> 本身的返回值始终是 <code>undefined</code>。</p>
</blockquote>`};export{e as default};