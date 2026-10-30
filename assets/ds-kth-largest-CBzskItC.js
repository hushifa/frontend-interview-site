var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>第 K 大的元素，是把数组从大到小排好后排在第 k 位的那个数，重复的数各算一次，<code>[3,2,3,1,2,4,5,5,6]</code> 里第 4 大是 4。最直接的做法是排序后取下标 <code>n - k</code>，时间 O(n log n)，题目希望不靠完整排序来做。</p>
<p>小顶堆的做法像只保留前 k 名的排行榜：堆里最多放 k 个数，堆顶是这 k 个里最小的。每来一个数就放进去，超过 k 个就把堆顶这个最小的踢掉。遍历完，堆里是最大的 k 个数，堆顶就是第 k 大。每次进出堆 O(log k)，总共 O(n log k)，空间 O(k)。</p>
<p>快速选择借用快速排序的分区：选一个基准，把比它小的放左边、大的放右边，基准落到的下标就是它排好序后的位置。如果正好是 <code>n - k</code> 就找到了，否则只往答案所在的那一侧继续，另一侧直接丢掉。每轮平均扔掉一半，总共平均 O(n)。</p>
<p>要注意，快速选择最坏是 O(n²)，基准总选到最大或最小值时每轮只排除一个数，所以基准要随机选。它还会原地打乱数组。堆的做法适合数据流式到达、内存只放得下 k 个的情况；快速选择适合数组已经在内存里、只求一次的情况。</p>
</blockquote>
<h2>两种写法</h2>
<p><code>MinHeap</code> 只写了用得到的方法，<code>push</code> 往上浮、<code>pop</code> 往下沉。快速选择用的是 Lomuto 分区，看 <code>quickSelect</code> 里怎样根据基准的位置决定往哪边走。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">class</span> <span class="hljs-title class_">MinHeap</span> {
  <span class="hljs-title function_">constructor</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">items</span> = [];
  }
  <span class="hljs-keyword">get</span> <span class="hljs-title function_">size</span>() {
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">items</span>.<span class="hljs-property">length</span>;
  }
  <span class="hljs-title function_">peek</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">items</span>[<span class="hljs-number">0</span>];
  }
  <span class="hljs-title function_">push</span>(<span class="hljs-params">value</span>) {
    <span class="hljs-keyword">const</span> a = <span class="hljs-variable language_">this</span>.<span class="hljs-property">items</span>;
    a.<span class="hljs-title function_">push</span>(value);
    <span class="hljs-keyword">let</span> i = a.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>;
    <span class="hljs-keyword">while</span> (i &gt; <span class="hljs-number">0</span>) {
      <span class="hljs-keyword">const</span> parent = (i - <span class="hljs-number">1</span>) &gt;&gt; <span class="hljs-number">1</span>;
      <span class="hljs-keyword">if</span> (a[parent] &lt;= a[i]) <span class="hljs-keyword">break</span>;
      [a[parent], a[i]] = [a[i], a[parent]];
      i = parent;
    }
  }
  <span class="hljs-title function_">pop</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">const</span> a = <span class="hljs-variable language_">this</span>.<span class="hljs-property">items</span>;
    <span class="hljs-keyword">const</span> top = a[<span class="hljs-number">0</span>];
    <span class="hljs-keyword">const</span> last = a.<span class="hljs-title function_">pop</span>();
    <span class="hljs-keyword">if</span> (a.<span class="hljs-property">length</span>) {
      a[<span class="hljs-number">0</span>] = last;
      <span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>;
      <span class="hljs-keyword">while</span> (<span class="hljs-literal">true</span>) {
        <span class="hljs-keyword">let</span> smallest = i;
        <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> child <span class="hljs-keyword">of</span> [<span class="hljs-number">2</span> * i + <span class="hljs-number">1</span>, <span class="hljs-number">2</span> * i + <span class="hljs-number">2</span>]) {
          <span class="hljs-keyword">if</span> (child &lt; a.<span class="hljs-property">length</span> &amp;&amp; a[child] &lt; a[smallest]) smallest = child;
        }
        <span class="hljs-keyword">if</span> (smallest === i) <span class="hljs-keyword">break</span>;
        [a[smallest], a[i]] = [a[i], a[smallest]];
        i = smallest;
      }
    }
    <span class="hljs-keyword">return</span> top;
  }
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">findKthLargestByHeap</span>(<span class="hljs-params">nums, k</span>) {
  <span class="hljs-keyword">const</span> heap = <span class="hljs-keyword">new</span> <span class="hljs-title class_">MinHeap</span>();
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> num <span class="hljs-keyword">of</span> nums) {
    heap.<span class="hljs-title function_">push</span>(num);
    <span class="hljs-keyword">if</span> (heap.<span class="hljs-property">size</span> &gt; k) heap.<span class="hljs-title function_">pop</span>();
  }
  <span class="hljs-keyword">return</span> heap.<span class="hljs-title function_">peek</span>();
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">partition</span>(<span class="hljs-params">a, lo, hi</span>) {
  <span class="hljs-keyword">const</span> r = lo + <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">floor</span>(<span class="hljs-title class_">Math</span>.<span class="hljs-title function_">random</span>() * (hi - lo + <span class="hljs-number">1</span>));
  [a[r], a[hi]] = [a[hi], a[r]];
  <span class="hljs-keyword">const</span> pivot = a[hi];
  <span class="hljs-keyword">let</span> store = lo;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = lo; i &lt; hi; i++) {
    <span class="hljs-keyword">if</span> (a[i] &lt; pivot) {
      [a[i], a[store]] = [a[store], a[i]];
      store++;
    }
  }
  [a[store], a[hi]] = [a[hi], a[store]];
  <span class="hljs-keyword">return</span> store;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">findKthLargestByQuickSelect</span>(<span class="hljs-params">nums, k</span>) {
  <span class="hljs-keyword">const</span> a = [...nums];
  <span class="hljs-keyword">const</span> target = a.<span class="hljs-property">length</span> - k;
  <span class="hljs-keyword">let</span> lo = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> hi = a.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>;
  <span class="hljs-keyword">while</span> (<span class="hljs-literal">true</span>) {
    <span class="hljs-keyword">const</span> p = <span class="hljs-title function_">partition</span>(a, lo, hi);
    <span class="hljs-keyword">if</span> (p === target) <span class="hljs-keyword">return</span> a[p];
    <span class="hljs-keyword">if</span> (p &lt; target) lo = p + <span class="hljs-number">1</span>;
    <span class="hljs-keyword">else</span> hi = p - <span class="hljs-number">1</span>;
  }
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">findKthLargestByHeap</span>([<span class="hljs-number">3</span>, <span class="hljs-number">2</span>, <span class="hljs-number">1</span>, <span class="hljs-number">5</span>, <span class="hljs-number">6</span>, <span class="hljs-number">4</span>], <span class="hljs-number">2</span>)); <span class="hljs-comment">// 5</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">findKthLargestByHeap</span>([<span class="hljs-number">3</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>, <span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">4</span>, <span class="hljs-number">5</span>, <span class="hljs-number">5</span>, <span class="hljs-number">6</span>], <span class="hljs-number">4</span>)); <span class="hljs-comment">// 4</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">findKthLargestByQuickSelect</span>([<span class="hljs-number">3</span>, <span class="hljs-number">2</span>, <span class="hljs-number">1</span>, <span class="hljs-number">5</span>, <span class="hljs-number">6</span>, <span class="hljs-number">4</span>], <span class="hljs-number">2</span>)); <span class="hljs-comment">// 5</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">findKthLargestByQuickSelect</span>([<span class="hljs-number">3</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>, <span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">4</span>, <span class="hljs-number">5</span>, <span class="hljs-number">5</span>, <span class="hljs-number">6</span>], <span class="hljs-number">4</span>)); <span class="hljs-comment">// 4</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">findKthLargestByQuickSelect</span>([<span class="hljs-number">7</span>], <span class="hljs-number">1</span>)); <span class="hljs-comment">// 7</span>
</code></pre></div>
<p>为什么找第 k 大要用小顶堆，不是大顶堆？堆里要留下的是最大的 k 个数，需要随时踢掉的是这 k 个里最小的那个，小顶堆的堆顶正好就是它，O(1) 能看到，O(log k) 能删掉。用大顶堆也能做，但要把 n 个数全放进去再弹 k − 1 次，空间是 O(n)。</p>
<p>快速选择里 <code>target = a.length - k</code> 是怎么来的？从小到大排好序后，第 1 大在下标 <code>n - 1</code>，第 k 大在下标 <code>n - k</code>。<code>partition</code> 返回基准最终的下标，它左边都比它小，右边都不小于它，所以它就在排好序以后的位置上。基准下标比目标小，答案只能在右边；比目标大，答案只能在左边。</p>
<p>示例里的快速选择用了 <code>Math.random</code>，每次运行分区的过程不同，但返回的值是确定的，因为第 k 大的数只有一个值。函数先复制了数组，避免原地交换改掉调用方的数据。</p>
<h2>复杂度从哪来</h2>
<p>快速选择平均 O(n) 是这么算的：基准随机时，每轮平均能把范围缩小到原来的一半左右，各轮的扫描量是 n、n/2、n/4……加起来不超过 2n。快速排序要两边都递归，每层都要扫完整个数组，所以是 O(n log n)；快速选择只走一边，省掉了这个 log。最坏情况是每轮基准都选到当前范围的最值，扫描量是 n、n − 1、n − 2……加起来 O(n²)。</p>
<p>还有一点：Lomuto 分区遇到大量重复值时，等于基准的数全都分到同一边，全是相同的值时会退化。处理方法是三路分区，把等于基准的数单独归为中间一段，目标下标落在这一段里就直接返回。</p>
<p>堆的做法时间稳定在 O(n log k)，k 很小时接近 O(n)。小顶堆的完整实现和插入、删除的过程见<a href="/questions/alg-priority-queue/">《前端任务怎样按优先级排队？二叉堆为什么不需要每次完整排序？》</a>，快速排序的分区见<a href="/questions/ds-sorting/">《快速排序和归并排序怎样实现？时间复杂度和稳定性有什么区别？》</a>。</p>
<h2>常见追问</h2>
<p><strong>直接 <code>sort</code> 再取值可以吗？</strong></p>
<blockquote>
<p>面试里先说出来没问题，时间 O(n log n)，代码最短。要记得传比较函数，<code>nums.sort((a, b) =&gt; b - a)[k - 1]</code>，因为 MDN 说明不传比较函数时 <code>sort</code> 会按字符串比较，<code>[1, 10, 9].sort()</code> 得到的是 <code>[1, 10, 9]</code>，不是按数值排好的 <code>[1, 9, 10]</code>。还要注意 <code>sort</code> 会修改原数组。</p>
</blockquote>
<p><strong>要求返回前 k 大的所有元素呢？</strong></p>
<blockquote>
<p>小顶堆跑完以后，堆里剩下的就是前 k 大，只是没有排序，需要的话再排一下，O(k log k)。快速选择找到下标 <code>n - k</code> 时，右边的部分也正好是前 k 大的数。</p>
</blockquote>
<p><strong>数据是源源不断到来的，怎么随时给出第 k 大？</strong></p>
<blockquote>
<p>用小顶堆。每来一个数就 <code>push</code>，超过 k 个就 <code>pop</code>，任何时候堆顶都是目前为止的第 k 大，空间只要 O(k)。快速选择需要整个数组都在手里，不适合这种场景。</p>
</blockquote>`};export{e as default};