var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>面试官让你在不用原生方法的前提下写一个 <code>myMap</code>，最简单的写法是 <code>for</code> 循环加 <code>push</code>，但这样会漏掉几个细节：稀疏数组的空位、<code>thisArg</code> 参数，还有 <code>reduce</code> 不传初始值时的行为。</p>
<p>三个方法的骨架一样：先检查回调是不是函数，再读取 <code>length</code>，从 0 到 <code>length - 1</code> 逐个下标处理。MDN 写明回调只对“有值的下标”调用，空位会被跳过，所以每个下标要先用 <code>i in obj</code> 判断一下。</p>
<p>不同的地方在于结果怎么收集。<code>map</code> 返回一个同样长度的新数组，空位在结果里仍然是空位；<code>filter</code> 只把回调返回真值的元素放进新数组；<code>reduce</code> 把上一次的返回值传给下一次，最后返回一个值。</p>
<p>要注意 <code>reduce</code> 的两个边界。它不接受 <code>thisArg</code>；不传初始值时，累加器从第一个存在的元素开始，回调从下一个元素开始调用，如果数组里一个元素都没有，就抛出 <code>TypeError</code>。</p>
</blockquote>
<h2>先写 map 和 filter</h2>
<p>下面的实现重点看两处：用 <code>i in obj</code> 跳过空位，用 <code>callback.call(thisArg, ...)</code> 把第二个参数绑成回调里的 <code>this</code>。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">myMap</span>(<span class="hljs-params">callback, thisArg</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> callback !== <span class="hljs-string">&#x27;function&#x27;</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(callback + <span class="hljs-string">&#x27; is not a function&#x27;</span>);
  }
  <span class="hljs-keyword">const</span> obj = <span class="hljs-title class_">Object</span>(<span class="hljs-variable language_">this</span>);
  <span class="hljs-keyword">const</span> len = obj.<span class="hljs-property">length</span> &gt;&gt;&gt; <span class="hljs-number">0</span>;
  <span class="hljs-keyword">const</span> result = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Array</span>(len);
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; len; i++) {
    <span class="hljs-keyword">if</span> (i <span class="hljs-keyword">in</span> obj) {
      result[i] = callback.<span class="hljs-title function_">call</span>(thisArg, obj[i], i, obj);
    }
  }
  <span class="hljs-keyword">return</span> result;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">myFilter</span>(<span class="hljs-params">callback, thisArg</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> callback !== <span class="hljs-string">&#x27;function&#x27;</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(callback + <span class="hljs-string">&#x27; is not a function&#x27;</span>);
  }
  <span class="hljs-keyword">const</span> obj = <span class="hljs-title class_">Object</span>(<span class="hljs-variable language_">this</span>);
  <span class="hljs-keyword">const</span> len = obj.<span class="hljs-property">length</span> &gt;&gt;&gt; <span class="hljs-number">0</span>;
  <span class="hljs-keyword">const</span> result = [];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; len; i++) {
    <span class="hljs-keyword">if</span> (i <span class="hljs-keyword">in</span> obj &amp;&amp; callback.<span class="hljs-title function_">call</span>(thisArg, obj[i], i, obj)) {
      result.<span class="hljs-title function_">push</span>(obj[i]);
    }
  }
  <span class="hljs-keyword">return</span> result;
}

<span class="hljs-title class_">Array</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>.<span class="hljs-property">myMap</span> = myMap;
<span class="hljs-title class_">Array</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>.<span class="hljs-property">myFilter</span> = myFilter;

<span class="hljs-keyword">const</span> sparse = [<span class="hljs-number">1</span>, , <span class="hljs-number">3</span>];
<span class="hljs-keyword">const</span> doubled = sparse.<span class="hljs-title function_">myMap</span>(<span class="hljs-function">(<span class="hljs-params">x</span>) =&gt;</span> x * <span class="hljs-number">2</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(doubled.<span class="hljs-property">length</span>); <span class="hljs-comment">// 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">1</span> <span class="hljs-keyword">in</span> doubled); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(sparse.<span class="hljs-title function_">myFilter</span>(<span class="hljs-function">(<span class="hljs-params">x</span>) =&gt;</span> x &gt; <span class="hljs-number">0</span>)); <span class="hljs-comment">// [ 1, 3 ]</span>

<span class="hljs-keyword">const</span> limit = { <span class="hljs-attr">max</span>: <span class="hljs-number">2</span> };
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>].<span class="hljs-title function_">myFilter</span>(<span class="hljs-keyword">function</span> (<span class="hljs-params">x</span>) { <span class="hljs-keyword">return</span> x &lt;= <span class="hljs-variable language_">this</span>.<span class="hljs-property">max</span>; }, limit)); <span class="hljs-comment">// [ 1, 2 ]</span>
</code></pre></div>
<p>为什么 <code>doubled</code> 的长度是 3，下标 1 却不存在？因为 <code>[1, , 3]</code> 的第二个位置是空位，不是 <code>undefined</code>。MDN 说 <code>map</code> 的回调只对有值的下标调用，稀疏数组经过 <code>map</code> 以后仍然是稀疏的。实现里用 <code>new Array(len)</code> 先建一个同样长度的空数组，只给存在的下标赋值，空位就自然保留下来了。<code>filter</code> 没有这个问题，它跳过空位，只收集通过的元素，所以结果是 <code>[1, 3]</code>。</p>
<p><code>i in obj</code> 和 <code>obj[i] !== undefined</code> 不是一回事。<code>[1, undefined, 3]</code> 的第二个位置有值，值恰好是 <code>undefined</code>，原生方法会对它调用回调；只有真正的空位才跳过。</p>
<p><code>Object(this)</code> 和 <code>length &gt;&gt;&gt; 0</code> 是为了贴近原生方法的“通用”特性。MDN 说这几个方法只要求 <code>this</code> 有 <code>length</code> 属性和整数下标，所以 <code>Array.prototype.map.call(类数组对象, fn)</code> 也能用。<code>&gt;&gt;&gt; 0</code> 把 <code>length</code> 转成非负整数，面试里不写这一步一般也能接受。</p>
<p><code>thisArg</code> 只对普通函数有用。箭头函数没有自己的 <code>this</code>，传了 <code>thisArg</code> 也不起作用，所以例子里用的是 <code>function</code>。</p>
<h2>再写 reduce</h2>
<p><code>reduce</code> 难在没有初始值的情况。下面看累加器从哪里开始，以及什么时候抛错。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">myReduce</span>(<span class="hljs-params">callback, ...rest</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> callback !== <span class="hljs-string">&#x27;function&#x27;</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(callback + <span class="hljs-string">&#x27; is not a function&#x27;</span>);
  }
  <span class="hljs-keyword">const</span> obj = <span class="hljs-title class_">Object</span>(<span class="hljs-variable language_">this</span>);
  <span class="hljs-keyword">const</span> len = obj.<span class="hljs-property">length</span> &gt;&gt;&gt; <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> acc;
  <span class="hljs-keyword">if</span> (rest.<span class="hljs-property">length</span> &gt; <span class="hljs-number">0</span>) {
    acc = rest[<span class="hljs-number">0</span>];
  } <span class="hljs-keyword">else</span> {
    <span class="hljs-comment">// 没有初始值时，用第一个存在的元素当起点</span>
    <span class="hljs-keyword">while</span> (i &lt; len &amp;&amp; !(i <span class="hljs-keyword">in</span> obj)) i++;
    <span class="hljs-keyword">if</span> (i &gt;= len) {
      <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;Reduce of empty array with no initial value&#x27;</span>);
    }
    acc = obj[i++];
  }
  <span class="hljs-keyword">for</span> (; i &lt; len; i++) {
    <span class="hljs-keyword">if</span> (i <span class="hljs-keyword">in</span> obj) {
      acc = <span class="hljs-title function_">callback</span>(acc, obj[i], i, obj);
    }
  }
  <span class="hljs-keyword">return</span> acc;
}

<span class="hljs-title class_">Array</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>.<span class="hljs-property">myReduce</span> = myReduce;

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>].<span class="hljs-title function_">myReduce</span>(<span class="hljs-function">(<span class="hljs-params">a, b</span>) =&gt;</span> a + b)); <span class="hljs-comment">// 6</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>([].<span class="hljs-title function_">myReduce</span>(<span class="hljs-function">(<span class="hljs-params">a, b</span>) =&gt;</span> a + b, <span class="hljs-number">0</span>)); <span class="hljs-comment">// 0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>([, , <span class="hljs-number">5</span>].<span class="hljs-title function_">myReduce</span>(<span class="hljs-function">(<span class="hljs-params">a, b</span>) =&gt;</span> a + b)); <span class="hljs-comment">// 5</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>([<span class="hljs-literal">undefined</span>].<span class="hljs-title function_">myReduce</span>(<span class="hljs-function">(<span class="hljs-params">a, b</span>) =&gt;</span> a + b, <span class="hljs-number">1</span>)); <span class="hljs-comment">// NaN</span>
<span class="hljs-keyword">try</span> {
  [].<span class="hljs-title function_">myReduce</span>(<span class="hljs-function">(<span class="hljs-params">a, b</span>) =&gt;</span> a + b);
} <span class="hljs-keyword">catch</span> (e) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(e <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">TypeError</span>); <span class="hljs-comment">// true</span>
}
<span class="hljs-keyword">try</span> {
  [].<span class="hljs-title function_">reduce</span>(<span class="hljs-function">(<span class="hljs-params">a, b</span>) =&gt;</span> a + b);
} <span class="hljs-keyword">catch</span> (e) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(e.<span class="hljs-property">constructor</span>.<span class="hljs-property">name</span>); <span class="hljs-comment">// TypeError</span>
}
</code></pre></div>
<p>为什么用 <code>...rest</code> 判断有没有初始值，而不是判断 <code>initialValue === undefined</code>？因为调用者可能就是想用 <code>undefined</code> 当初始值，<code>[1].reduce(fn, undefined)</code> 和 <code>[1].reduce(fn)</code> 的行为不同。只有看实际传了几个参数，才能把这两种情况分开。</p>
<p>没有初始值时，MDN 的说法是累加器取数组的第一个值，回调从第二个值开始执行，数组为空就抛 <code>TypeError</code>。再加上“跳过空位”这条规则，<code>[, , 5]</code> 的第一个存在的元素是 5，后面没有别的元素，回调一次也没调用，直接返回 5。<code>[undefined]</code> 加初始值 1 的例子说明空位和 <code>undefined</code> 的区别：<code>undefined</code> 是真实的元素，会参与计算，<code>1 + undefined</code> 得到 <code>NaN</code>。</p>
<p>还要注意 <code>reduce</code> 没有 <code>thisArg</code> 参数。MDN 写明它和其他迭代方法不同，回调总是以 <code>undefined</code> 作为 <code>this</code> 调用，所以实现里直接写 <code>callback(...)</code>，不用 <code>call</code>。</p>
<h2>常见追问</h2>
<p><strong>为什么不直接把方法挂到 Array.prototype 上？</strong></p>
<blockquote>
<p>例子里挂上去只是为了演示调用方式。实际项目里修改内置原型会影响所有代码，和以后新增的同名原生方法也可能冲突。写 polyfill 时一般先判断原生方法不存在再补，并且用 <code>Object.defineProperty</code> 设成不可枚举，避免 <code>for...in</code> 遍历时多出这个属性。</p>
</blockquote>
<p><strong>能用 reduce 实现 map 和 filter 吗？</strong></p>
<blockquote>
<p>能。<code>map</code> 就是 <code>arr.reduce((acc, x, i) =&gt; { acc.push(fn(x, i)); return acc; }, [])</code>，<code>filter</code> 是满足条件时才 <code>push</code>。不过这样写跳过空位后结果会变成紧凑数组，和原生 <code>map</code> 保留空位的行为不同。</p>
</blockquote>
<p><strong>回调里修改原数组会怎样？</strong></p>
<blockquote>
<p>原生方法在开始前就读取了 <code>length</code>，遍历过程中新加到末尾的元素不会被访问；被删除的、还没访问到的元素会因为下标不存在而被跳过。上面的实现也是先读 <code>len</code> 再循环，每次用 <code>in</code> 判断，所以行为一致。</p>
</blockquote>`};export{e as default};