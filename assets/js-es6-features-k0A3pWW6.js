var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>ES6 也叫 ES2015，是 2015 年发布的那一版。它一次加了很多东西：<code>let</code>、<code>const</code> 有了块级作用域；解构和展开让取值、合并数组更方便；箭头函数写回调更短；模板字符串可以直接插变量；<code>class</code> 让继承写法更清楚；<code>import</code>、<code>export</code> 有了语言自带的模块；<code>Promise</code> 统一了异步写法；<code>Map</code>、<code>Set</code>、<code>Symbol</code> 和迭代器也是这一版加的。</p>
<p>从 ES2016 开始，规范改成每年一版，每版只加少量功能。常用的有 ES2017 的 <code>async</code>/<code>await</code>，ES2018 的对象展开和 <code>Promise.prototype.finally</code>，ES2020 的可选链 <code>?.</code>、空值合并 <code>??</code> 和 <code>BigInt</code>，ES2022 的 <code>at()</code>、类的私有字段和顶层 <code>await</code>，ES2023 的 <code>toSorted</code> 这类不改原数组的方法。</p>
<p>这些特性的用处很具体：<code>const</code> 防止变量被重新赋值，解构配默认值让函数参数更好读，<code>?.</code> 和 <code>??</code> 让读取深层属性、给默认值不再写一长串判断。</p>
<p>要注意几个容易问到的细节：<code>const</code> 只是变量不能重新赋值，对象内容照样能改；展开只拷贝一层；箭头函数没有自己的 <code>this</code>；<code>??</code> 只在 <code>null</code> 和 <code>undefined</code> 时取默认值，和 <code>||</code> 不一样。</p>
</blockquote>
<h2>按版本看主要特性</h2>
<p>ECMAScript 是 JavaScript 的语言规范。TC39 委员会在“已完成提案”列表里给每个特性标了发布年份，下面按这个年份列出面试常问的部分。</p>
<table><thead><tr><th>版本</th><th>特性</th><th>用来做什么</th></tr></thead><tbody><tr><td>ES2015</td><td><code>let</code>、<code>const</code></td><td>块级作用域，<code>const</code> 不能重新赋值</td></tr><tr><td>ES2015</td><td>解构、默认参数、剩余参数</td><td>从数组和对象里按位置或名字取值</td></tr><tr><td>ES2015</td><td>数组展开 <code>...</code></td><td>复制、合并数组，把数组摊开传参</td></tr><tr><td>ES2015</td><td>箭头函数</td><td>更短的回调，<code>this</code> 取外层的</td></tr><tr><td>ES2015</td><td>模板字符串</td><td>插值和多行字符串</td></tr><tr><td>ES2015</td><td><code>class</code></td><td>构造函数加原型的另一种写法</td></tr><tr><td>ES2015</td><td><code>import</code> / <code>export</code></td><td>语言自带的模块系统</td></tr><tr><td>ES2015</td><td><code>Promise</code></td><td>统一的异步结果对象</td></tr><tr><td>ES2015</td><td><code>Map</code>、<code>Set</code>、<code>WeakMap</code>、<code>WeakSet</code></td><td>任意类型做键的映射、去重集合</td></tr><tr><td>ES2015</td><td><code>Symbol</code>、迭代器、Generator</td><td>唯一键、<code>for...of</code> 和可暂停的函数</td></tr><tr><td>ES2016</td><td><code>Array.prototype.includes</code>、<code>**</code></td><td>判断包含、求幂</td></tr><tr><td>ES2017</td><td><code>async</code> / <code>await</code></td><td>用同步的写法写异步流程</td></tr><tr><td>ES2018</td><td>对象展开和剩余属性、<code>Promise.prototype.finally</code></td><td>浅拷贝合并对象、成功失败都执行的收尾</td></tr><tr><td>ES2019</td><td><code>flat</code>、<code>flatMap</code>、<code>Object.fromEntries</code></td><td>扁平化数组、把键值对转回对象</td></tr><tr><td>ES2020</td><td><code>?.</code>、<code>??</code>、<code>BigInt</code>、<code>Promise.allSettled</code>、<code>globalThis</code></td><td>安全读取、默认值、大整数</td></tr><tr><td>ES2021</td><td><code>replaceAll</code>、<code>Promise.any</code>、<code>??=</code> 等逻辑赋值、数字分隔符 <code>1_000</code></td><td>字符串替换、取第一个成功的 Promise</td></tr><tr><td>ES2022</td><td><code>at()</code>、类字段和 <code>#私有</code> 成员、顶层 <code>await</code>、<code>Object.hasOwn</code></td><td>负数下标取值、真正的私有属性</td></tr><tr><td>ES2023</td><td><code>toSorted</code>、<code>toReversed</code>、<code>with</code>、<code>findLast</code></td><td>不改原数组的排序和替换</td></tr><tr><td>ES2024</td><td><code>Object.groupBy</code>、<code>Promise.withResolvers</code></td><td>分组、在外面拿到 resolve</td></tr><tr><td>ES2025</td><td>迭代器辅助方法、Set 的集合运算、<code>Promise.try</code></td><td>对迭代器链式 <code>map</code>、<code>filter</code>，求交集并集</td></tr></tbody></table>
<p>面试里说“ES6 新特性”，大多数时候指的是 ES2015 这一大版，所以先把第一部分讲清楚，再提几个后续版本里常用的就够了。</p>
<h2>一段代码里的常用写法</h2>
<p>下面这段把解构默认值、展开、模板字符串、可选链和空值合并放在一起，注意每一行用的是哪个特性。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> user = { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;小明&#x27;</span>, <span class="hljs-attr">profile</span>: { <span class="hljs-attr">age</span>: <span class="hljs-number">0</span> } };
<span class="hljs-keyword">const</span> { name, role = <span class="hljs-string">&#x27;访客&#x27;</span> } = user;
<span class="hljs-keyword">const</span> merged = { ...user, role };

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`<span class="hljs-subst">\${name}</span>-<span class="hljs-subst">\${role}</span>\`</span>); <span class="hljs-comment">// 小明-访客</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">String</span>(merged.<span class="hljs-property">profile</span> === user.<span class="hljs-property">profile</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(user.<span class="hljs-property">profile</span>?.<span class="hljs-property">age</span> ?? <span class="hljs-number">18</span>); <span class="hljs-comment">// 0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(user.<span class="hljs-property">address</span>?.<span class="hljs-property">city</span> ?? <span class="hljs-string">&#x27;未知&#x27;</span>); <span class="hljs-comment">// 未知</span>
</code></pre></div>
<p><code>role</code> 在 <code>user</code> 里不存在，解构时就用了默认值“访客”。解构默认值只在取到 <code>undefined</code> 时生效，取到 <code>null</code> 不会用默认值。</p>
<p>为什么 <code>merged.profile === user.profile</code> 是 <code>true</code>？因为对象展开只复制第一层属性，<code>profile</code> 是对象，复制过去的是同一个引用，改 <code>merged.profile.age</code> 也会改到 <code>user</code>。要完整复制，见<a href="/questions/js-copy-structured-clone/">《浅拷贝、深拷贝和 structuredClone 如何选择？》</a>。</p>
<p><code>user.profile?.age ?? 18</code> 输出 0，没有变成 18。因为 <code>??</code> 只把 <code>null</code> 和 <code>undefined</code> 当作“没有值”，0 是有效的值。换成 <code>||</code> 就会得到 18。<code>user.address</code> 不存在，<code>?.</code> 让整个表达式直接返回 <code>undefined</code>，不会报错，再由 <code>??</code> 补上“未知”。两者的细节见<a href="/questions/js-optional-nullish/">《可选链和空值合并为什么不能简单替换为 &amp;&amp; 和 ||？》</a>。</p>
<h2>面试官会接着问什么</h2>
<p><code>let</code>、<code>const</code> 和 <code>var</code> 的区别，最常追问的是暂时性死区和 <code>for</code> 循环里的闭包，见<a href="/questions/js-scope-hoisting/">《var、let、const 和暂时性死区有什么关系？》</a>。这里只记一条：<code>const</code> 保证的是变量不能重新赋值，<code>const obj = {}</code> 以后照样能写 <code>obj.a = 1</code>。</p>
<p>箭头函数常被问 <code>this</code>、<code>arguments</code> 和能不能 <code>new</code>，见<a href="/questions/js-arrow-function/">《箭头函数和普通函数有哪些区别？》</a>。<code>class</code> 常被问它和原型的关系，见<a href="/questions/js-prototype-class/">《原型链、class 和继承之间是什么关系？》</a>。</p>
<p>模块常被问和 CommonJS 的区别，比如 ES 模块的导入是静态的、导出的是活的绑定，见<a href="/questions/js-esm-cjs/">《ES Modules 和 CommonJS 有哪些关键区别？》</a>。<code>Promise</code> 和 <code>async</code>/<code>await</code> 常连着问事件循环，见<a href="/questions/js-promise-chain/">《回调地狱是什么？Promise 链式调用怎样解决它？then 的返回值有哪些规则？》</a>和<a href="/questions/js-event-loop/">《事件循环中，任务和微任务按什么顺序执行？》</a>。<code>Map</code>、<code>Set</code> 常被问和普通对象的区别，见<a href="/questions/js-map-set-weak/">《Map、Set、WeakMap 与普通对象各有什么用途？》</a>。</p>
<h2>常见追问</h2>
<p><strong>ES6 和 ES2015 是什么关系？</strong></p>
<blockquote>
<p>是同一版。ES6 指第 6 版规范，2015 年 6 月通过，正式名字是 ECMAScript 2015。规范前言写明，从 ECMAScript 2016 开始改为每年发布一版，所以现在一般直接说年份。</p>
</blockquote>
<p><strong>新特性在旧浏览器上不能用怎么办？</strong></p>
<blockquote>
<p>分两种情况。新语法，比如可选链、类字段，要靠 Babel、TypeScript 这类工具在构建时转成旧语法。新的内置方法，比如 <code>Array.prototype.at</code>，转换语法没用，要引入 polyfill 补上实现。</p>
</blockquote>`};export{e as default};