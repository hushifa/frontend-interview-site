var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>快速排序的做法是：从数组里挑一个数当基准，把比它小的放左边、比它大的放右边，然后对左右两部分分别重复这个过程，直到每部分只剩一个数。归并排序反过来：先把数组对半拆，一直拆到每份只有一个数，再把相邻的两份按大小合并成一份有序的，一层层合并回去。</p>
<p>两者平均都是 O(n log n)。区别在最坏情况和稳定性。快速排序如果每次选的基准都是最大或最小值，比如对已经有序的数组总选第一个数，每次只分出一个数，就退化成 O(n²)，所以基准一般随机选或取中间位置。归并排序无论输入怎样都是 O(n log n)，但合并时需要一块额外数组，空间是 O(n)。</p>
<p>稳定性是说值相同的两项，排序后还保持原来的先后顺序。归并排序合并时遇到相等的值优先取左边那份，所以是稳定的；快速排序分区时会交换位置，一般不稳定。</p>
<p>要注意，日常开发直接用 <code>arr.sort((a, b) =&gt; a - b)</code>。ES2019 起规范要求 <code>sort</code> 是稳定的；不传比较函数时它按字符串排序，<code>[10, 2, 1].sort()</code> 会得到 <code>[1, 10, 2]</code>。</p>
</blockquote>
<h2>两种排序的实现</h2>
<p>下面的实现都返回新数组，不修改输入：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">quickSort</span>(<span class="hljs-params">arr</span>) {
  <span class="hljs-keyword">if</span> (arr.<span class="hljs-property">length</span> &lt;= <span class="hljs-number">1</span>) <span class="hljs-keyword">return</span> arr;
  <span class="hljs-keyword">const</span> pivot = arr[<span class="hljs-title class_">Math</span>.<span class="hljs-title function_">floor</span>(arr.<span class="hljs-property">length</span> / <span class="hljs-number">2</span>)];
  <span class="hljs-keyword">const</span> left = [];
  <span class="hljs-keyword">const</span> middle = [];
  <span class="hljs-keyword">const</span> right = [];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> item <span class="hljs-keyword">of</span> arr) {
    <span class="hljs-keyword">if</span> (item &lt; pivot) left.<span class="hljs-title function_">push</span>(item);
    <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (item &gt; pivot) right.<span class="hljs-title function_">push</span>(item);
    <span class="hljs-keyword">else</span> middle.<span class="hljs-title function_">push</span>(item);
  }
  <span class="hljs-keyword">return</span> [...<span class="hljs-title function_">quickSort</span>(left), ...middle, ...<span class="hljs-title function_">quickSort</span>(right)];
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">mergeSort</span>(<span class="hljs-params">arr</span>) {
  <span class="hljs-keyword">if</span> (arr.<span class="hljs-property">length</span> &lt;= <span class="hljs-number">1</span>) <span class="hljs-keyword">return</span> arr;
  <span class="hljs-keyword">const</span> mid = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">floor</span>(arr.<span class="hljs-property">length</span> / <span class="hljs-number">2</span>);
  <span class="hljs-keyword">const</span> left = <span class="hljs-title function_">mergeSort</span>(arr.<span class="hljs-title function_">slice</span>(<span class="hljs-number">0</span>, mid));
  <span class="hljs-keyword">const</span> right = <span class="hljs-title function_">mergeSort</span>(arr.<span class="hljs-title function_">slice</span>(mid));
  <span class="hljs-keyword">const</span> result = [];
  <span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> j = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">while</span> (i &lt; left.<span class="hljs-property">length</span> &amp;&amp; j &lt; right.<span class="hljs-property">length</span>) {
    <span class="hljs-comment">// 相等时取左边，保证稳定</span>
    <span class="hljs-keyword">if</span> (left[i] &lt;= right[j]) result.<span class="hljs-title function_">push</span>(left[i++]);
    <span class="hljs-keyword">else</span> result.<span class="hljs-title function_">push</span>(right[j++]);
  }
  <span class="hljs-keyword">return</span> result.<span class="hljs-title function_">concat</span>(left.<span class="hljs-title function_">slice</span>(i), right.<span class="hljs-title function_">slice</span>(j));
}

<span class="hljs-keyword">const</span> data = [<span class="hljs-number">5</span>, <span class="hljs-number">3</span>, <span class="hljs-number">8</span>, <span class="hljs-number">1</span>, <span class="hljs-number">9</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>];
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">quickSort</span>(data).<span class="hljs-title function_">join</span>()); <span class="hljs-comment">// 1,2,3,3,5,8,9</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">mergeSort</span>(data).<span class="hljs-title function_">join</span>()); <span class="hljs-comment">// 1,2,3,3,5,8,9</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(data.<span class="hljs-title function_">join</span>()); <span class="hljs-comment">// 5,3,8,1,9,2,3</span>
</code></pre></div>
<p>快速排序为什么要单独放一个 <code>middle</code>？数组里可能有很多和基准相等的值，比如全是 3。如果把相等的值也放进 <code>left</code> 或 <code>right</code>，每次递归数组都不会变小，就会无限递归。单独收进 <code>middle</code>，每轮至少能确定基准这一组的位置。</p>
<p>这个快速排序写法好懂，但每层都新建数组，空间开销大。面试中如果被要求原地排序，就改成在原数组上用两个指针交换元素来分区，空间降到 O(log n) 的递归栈。</p>
<p>归并排序里 <code>left[i] &lt;= right[j]</code> 的等号不能去掉。去掉以后相等的值会优先取右边，原本在后面的项跑到了前面，排序就不稳定了。</p>
<h2>稳定性在什么时候有用</h2>
<p>表格先按姓名排好，用户再点“按部门排序”，希望同一个部门里的人仍然按姓名排列。这就要求第二次排序是稳定的：部门相同的两人，保持第一次排序后的先后顺序。因为现在 <code>Array.prototype.sort</code> 是稳定的，这种多次排序可以直接做。</p>
<h2>常见追问</h2>
<p><strong>还有哪些排序要知道？</strong></p>
<blockquote>
<p>冒泡排序和插入排序都是 O(n²)，插入排序在数组几乎有序时很快，接近 O(n)。堆排序是 O(n log n)、原地但不稳定，前端里更常见的是用堆做优先队列，见<a href="/questions/alg-priority-queue/">《前端任务怎样按优先级排队？二叉堆为什么不需要每次完整排序？》</a>。</p>
</blockquote>
<p><strong>为什么基于比较的排序不能比 O(n log n) 更快？</strong></p>
<blockquote>
<p>n 个数有 n! 种排列，每次比较只能把可能性分成两半，要确定唯一一种排列至少需要 log₂(n!) 次比较，这个量级就是 n log n。计数排序、桶排序不靠比较，在数值范围有限时可以做到线性时间。</p>
</blockquote>`};export{e as default};