var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>普通函数的 <code>this</code> 不是写代码时定的，而是调用的时候才定。写成 <code>obj.fn()</code>，<code>this</code> 就是 <code>obj</code>；直接写 <code>fn()</code>，严格模式下 <code>this</code> 是 <code>undefined</code>；用 <code>new</code> 调用，<code>this</code> 是新创建的实例。</p>
<p>想手动指定也可以。<code>call</code>、<code>apply</code> 是这一次调用临时指定 <code>this</code>，<code>bind</code> 是返回一个把 <code>this</code> 固定住的新函数。几种情况同时出现时，优先级是 <code>new</code> 最高，然后是 <code>bind</code>，然后是 <code>call</code>、<code>apply</code>，再是 <code>obj.fn()</code> 这种方法调用，最后是直接调用。</p>
<p>箭头函数不一样，它自己没有 <code>this</code>。在箭头函数里写 <code>this</code>，就像读一个外层变量，读的是定义它的位置外层的 <code>this</code>。所以 <code>call</code>、<code>bind</code> 都改不了它，它也不能用 <code>new</code> 调用。</p>
<p>最常踩的坑是把方法单独拿出来用，比如当成回调传给 <code>setInterval</code>，或者从对象里解构出来。这时候调用的地方没有 <code>obj.</code> 了，<code>this</code> 就丢了。</p>
</blockquote>
<h2>先看一个例子</h2>
<p>下面这个例子把几种调用方式放在一起。注意看同一个 <code>read</code> 方法，换一种调用方式，结果就不一样。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-meta">&#x27;use strict&#x27;</span>;

<span class="hljs-keyword">const</span> obj = {
  <span class="hljs-attr">value</span>: <span class="hljs-number">42</span>,
  <span class="hljs-title function_">read</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">value</span>;
  },
  <span class="hljs-title function_">later</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">value</span>;
  },
};

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(obj.<span class="hljs-title function_">read</span>()); <span class="hljs-comment">// 42</span>

<span class="hljs-keyword">const</span> read = obj.<span class="hljs-property">read</span>;
<span class="hljs-keyword">try</span> {
  <span class="hljs-title function_">read</span>();
} <span class="hljs-keyword">catch</span> (error) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">name</span>); <span class="hljs-comment">// TypeError</span>
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(read.<span class="hljs-title function_">call</span>({ <span class="hljs-attr">value</span>: <span class="hljs-number">7</span> })); <span class="hljs-comment">// 7</span>

<span class="hljs-keyword">const</span> later = obj.<span class="hljs-title function_">later</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(later.<span class="hljs-title function_">call</span>({ <span class="hljs-attr">value</span>: <span class="hljs-number">7</span> })); <span class="hljs-comment">// 42</span>
obj.<span class="hljs-property">value</span> = <span class="hljs-number">99</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">later</span>()); <span class="hljs-comment">// 99</span>
</code></pre></div>
<p><code>obj.read()</code> 返回 42，这很好理解，前面有 <code>obj.</code>，<code>this</code> 就是 <code>obj</code>。</p>
<p>可是把它赋给 <code>read</code> 再调用，就报了 <code>TypeError</code>。函数还是同一个函数，变的只是调用方式。<code>read()</code> 前面什么都没有，严格模式下 <code>this</code> 就是 <code>undefined</code>，读 <code>undefined.value</code> 当然报错。如果不是严格模式，<code>this</code> 会变成全局对象，结果是返回 <code>undefined</code>，不会报错。要注意 ES 模块和 class 里面默认就是严格模式。</p>
<p>再用 <code>read.call({ value: 7 })</code>，<code>this</code> 被临时指定成了传进去的对象，所以得到 7。</p>
<p>最后看箭头函数。<code>later</code> 返回的箭头函数，是在 <code>obj.later()</code> 执行的时候定义的，那时外层 <code>later</code> 的 <code>this</code> 是 <code>obj</code>，所以箭头函数里的 <code>this</code> 也是 <code>obj</code>。用 <code>call</code> 传别的对象进去，它直接忽略，还是返回 42。之后把 <code>obj.value</code> 改成 99，再调用就读到 99，因为它拿到的是 <code>obj</code> 这个对象，读的是对象上当前的值。</p>
<h2>普通函数的 this 怎么判断</h2>
<p>判断普通函数的 <code>this</code>，只看调用的那一行怎么写的，跟函数定义在哪里没有关系。按优先级从高到低排一下：</p>
<table><thead><tr><th>调用方式</th><th><code>this</code></th></tr></thead><tbody><tr><td><code>new Fn()</code></td><td>新创建的实例</td></tr><tr><td><code>fn.bind(o)()</code></td><td><code>o</code>（再次 bind 无效）</td></tr><tr><td><code>fn.call(o)</code> / <code>fn.apply(o)</code></td><td><code>o</code></td></tr><tr><td><code>obj.fn()</code></td><td><code>obj</code></td></tr><tr><td><code>fn()</code></td><td>严格模式 <code>undefined</code>，否则全局对象</td></tr><tr><td>箭头函数</td><td>外层作用域的 <code>this</code></td></tr></tbody></table>
<p>表里有两处值得用代码确认一下：<code>bind</code> 过的函数再 <code>bind</code> 一次没用，而 <code>new</code> 能盖过 <code>bind</code>。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">Person</span>(<span class="hljs-params">name</span>) {
  <span class="hljs-variable language_">this</span>.<span class="hljs-property">name</span> = name;
}

<span class="hljs-keyword">const</span> bound = <span class="hljs-title class_">Person</span>.<span class="hljs-title function_">bind</span>({ <span class="hljs-attr">tag</span>: <span class="hljs-string">&#x27;绑定的对象&#x27;</span> });
<span class="hljs-keyword">const</span> p = <span class="hljs-keyword">new</span> <span class="hljs-title function_">bound</span>(<span class="hljs-string">&#x27;Tom&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(p.<span class="hljs-property">name</span>); <span class="hljs-comment">// Tom</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(p <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">Person</span>); <span class="hljs-comment">// true</span>

<span class="hljs-keyword">function</span> <span class="hljs-title function_">readTag</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">tag</span>;
}

<span class="hljs-keyword">const</span> once = readTag.<span class="hljs-title function_">bind</span>({ <span class="hljs-attr">tag</span>: <span class="hljs-string">&#x27;第一次&#x27;</span> });
<span class="hljs-keyword">const</span> again = once.<span class="hljs-title function_">bind</span>({ <span class="hljs-attr">tag</span>: <span class="hljs-string">&#x27;第二次&#x27;</span> });
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">again</span>()); <span class="hljs-comment">// 第一次</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(once.<span class="hljs-title function_">call</span>({ <span class="hljs-attr">tag</span>: <span class="hljs-string">&#x27;call&#x27;</span> })); <span class="hljs-comment">// 第一次</span>
</code></pre></div>
<p><code>new bound(&#x27;Tom&#x27;)</code> 还是创建了一个新的 <code>Person</code> 实例，<code>bind</code> 时传的对象被忽略了，这说明 <code>new</code> 的优先级更高。<code>once</code> 已经绑定了第一个对象，之后再 <code>bind</code>、再 <code>call</code>，<code>this</code> 都改不动，读到的还是“第一次”。</p>
<p>DOM 事件监听也遵守这套规则。监听函数用普通函数写，浏览器调用它时会把 <code>this</code> 设成 <code>currentTarget</code>，也就是绑定监听的那个元素；用箭头函数写，<code>this</code> 就是外层的 <code>this</code>，跟元素无关。</p>
<h2>箭头函数的 this 为什么改不了</h2>
<p>箭头函数没有自己的 <code>this</code>。它里面写的 <code>this</code>，跟普通的外层变量一样，是顺着代码写的位置往外找的，这就是词法作用域。找到哪个函数的 <code>this</code>，就用哪个。</p>
<p>所以箭头函数的 <code>this</code> 在它定义的时候就跟外层绑在一起了，调用时用 <code>call</code>、<code>apply</code>、<code>bind</code> 传什么都没用。它也没有能给 <code>new</code> 用的构造行为，<code>new</code> 一个箭头函数会直接报 <code>TypeError</code>。</p>
<h2>对象里的箭头函数方法不指向对象</h2>
<p>这是一个常见误解。看下面的例子：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-meta">&#x27;use strict&#x27;</span>;

<span class="hljs-keyword">const</span> user = {
  <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;小明&#x27;</span>,
  <span class="hljs-attr">arrow</span>: <span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">this</span> === user,
  <span class="hljs-title function_">normal</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">name</span>;
  },
};

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(user.<span class="hljs-title function_">arrow</span>()); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(user.<span class="hljs-title function_">normal</span>()); <span class="hljs-comment">// 小明</span>
</code></pre></div>
<p>很多人以为 <code>arrow</code> 写在 <code>user</code> 里，<code>this</code> 就是 <code>user</code>。可它返回的是 <code>false</code>，<code>this</code> 根本不是 <code>user</code>。</p>
<p>原因是对象字面量的大括号不是函数，不会产生自己的 <code>this</code>。箭头函数往外找，找到的是对象外面那一层的 <code>this</code>。这个例子放在 Node 的 CommonJS 文件里运行，外层 <code>this</code> 是 <code>module.exports</code>；放在 ES 模块顶层，外层 <code>this</code> 是 <code>undefined</code>。不管哪种，都不是 <code>user</code>。</p>
<p>改法很简单：对象的方法用普通的方法写法 <code>normal() {}</code>，需要 <code>this</code> 指向对象时不要用箭头函数。</p>
<h2>回调里 this 丢了怎么办</h2>
<p>把方法当回调传出去，是丢 <code>this</code> 最常见的场景。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">class</span> <span class="hljs-title class_">Timer</span> {
  count = <span class="hljs-number">0</span>;
  <span class="hljs-title function_">start</span>(<span class="hljs-params"></span>) {
    <span class="hljs-built_in">setInterval</span>(<span class="hljs-variable language_">this</span>.<span class="hljs-property">tick</span>, <span class="hljs-number">1000</span>); <span class="hljs-comment">// tick 内 this 为 undefined</span>
  }
  <span class="hljs-title function_">tick</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">count</span> += <span class="hljs-number">1</span>;
  }
}
</code></pre></div>
<p><code>setInterval(this.tick, 1000)</code> 传进去的只是函数本身，没有带上 <code>this</code>。一秒后定时器调用它，相当于直接调用 <code>tick()</code>，class 里又是严格模式，所以 <code>this</code> 是 <code>undefined</code>，<code>this.count</code> 就报错了。</p>
<p>有三种常见改法：</p>
<ul>
<li>传一个箭头函数进去：<code>setInterval(() =&gt; this.tick(), 1000)</code>。箭头函数的 <code>this</code> 是 <code>start</code> 的 <code>this</code>，也就是实例，里面再用 <code>this.tick()</code> 正常调用。</li>
<li>在构造函数里绑定：<code>this.tick = this.tick.bind(this)</code>，之后传 <code>this.tick</code> 就不会丢了。</li>
<li>把方法写成类字段箭头函数：<code>tick = () =&gt; { this.count += 1; }</code>。代价是每个实例都会有一份自己的函数，而且它不在原型上，子类没法用 <code>super.tick()</code> 调用它。</li>
</ul>
<h2>常见追问</h2>
<p><strong>对象字面量里写 <code>{ fn: () =&gt; this }</code>，这个 <code>this</code> 是什么？</strong></p>
<blockquote>
<p>是这个对象字面量外层的 <code>this</code>，不是这个对象本身。因为对象的大括号不会产生新的 <code>this</code>，箭头函数会继续往外找。</p>
</blockquote>
<p><strong>为什么箭头函数不适合做原型方法？</strong></p>
<blockquote>
<p>原型方法要靠 <code>this</code> 拿到是哪个实例在调用它，可箭头函数的 <code>this</code> 在定义时就定死了，拿不到调用者。而且箭头函数不能用 <code>new</code> 调用，也不能当构造函数用。</p>
</blockquote>`};export{e as default};