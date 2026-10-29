var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>merge 和 rebase 都是把两条分支的改动合到一起，最后的代码可以完全一样，区别在历史长什么样。</p>
<p>merge 会新建一个合并提交，它有两个父提交，原来的提交都不动，历史里能看到分叉又汇合的过程。rebase 是把当前分支的提交在新的基础上一个个重新应用一遍，生成新的提交哈希，历史变成一条直线。</p>
<p>因为 rebase 会换掉原来的提交，所以已经推送并被别人使用的分支不要 rebase，否则会改写别人依赖的历史。</p>
<p>常见做法是：在自己的功能分支上用 rebase 跟上主分支，合入主分支时用 merge 或 squash merge。两者在冲突处理和回滚方式上也不一样。</p>
</blockquote>
<h2>两种历史长什么样</h2>
<p>开始时，功能分支从 B 分出来，之后主分支又多了一个 C：</p>
<div class="not-prose code-block"><div class="code-language">代码</div><pre><code>A---B---C          main
     \\
      D---E        feature
</code></pre></div>
<p>在 feature 上执行 <code>git merge main</code>（或者在 main 上合并 feature），会多出一个合并提交 M：</p>
<div class="not-prose code-block"><div class="code-language">代码</div><pre><code>A---B---C-------M  main
     \\         /
      D-------E    feature
</code></pre></div>
<p>在 feature 上执行 <code>git rebase main</code>，D 和 E 被搬到了 C 后面：</p>
<div class="not-prose code-block"><div class="code-language">代码</div><pre><code>A---B---C          main
         \\
          D&#x27;--E&#x27;   feature
</code></pre></div>
<p>为什么叫 D&#x27; 而不是 D？因为提交的哈希是连同父提交一起算的。D&#x27; 的改动内容和 D 一样，但父提交从 B 变成了 C，所以它是一个新提交。原来的 D、E 还在仓库里，只是不再有分支指向它们。</p>
<h2>两者怎么比</h2>
<table><thead><tr><th></th><th>merge</th><th>rebase</th></tr></thead><tbody><tr><td>原有提交</td><td>保留</td><td>被替换为新提交</td></tr><tr><td>历史形状</td><td>保留分叉和合并点</td><td>一条直线</td></tr><tr><td>冲突处理</td><td>一次性解决所有冲突</td><td>每个提交都可能要单独解决</td></tr><tr><td>共享分支</td><td>安全</td><td>会让别人的本地分支和远端分叉</td></tr><tr><td>回滚</td><td>用 <code>git revert -m 1 &lt;合并提交&gt;</code> 一次撤销整个功能</td><td>需要逐个撤销提交，或撤销 squash 后的单个提交</td></tr></tbody></table>
<p>冲突那一行值得多说一句。merge 是拿两边的最终结果比一次，有冲突一次解决完。rebase 是一个提交一个提交地重放，同一处冲突可能在好几个提交上反复出现。</p>
<h2>什么时候用哪个</h2>
<p>自己一个人的功能分支要跟上主分支时，用 <code>git pull --rebase</code> 或 <code>git rebase main</code>，避免出现一堆没意义的合并提交。rebase 之后再推送一个已经推送过的分支，要用 <code>git push --force-with-lease</code>，它会在远端被别人更新过时拒绝覆盖，比直接 <code>--force</code> 安全。</p>
<p>合入主分支时按团队约定。squash merge 让每个 PR 在主分支上只剩一个提交，好读也好回滚；merge commit 则保留完整的开发过程。</p>
<p>多人一起用的分支，只用 merge。</p>
<p>合入前想整理提交，可以用 <code>git rebase -i</code> 合并、重排、改提交信息，前提是这些提交还没被别人用。</p>
<h2>rebase 出错了怎么办</h2>
<p>冲突解决到一半想放弃，用 <code>git rebase --abort</code>，回到开始之前的状态。</p>
<p>rebase 已经做完才发现有问题，可以用 <code>git reflog</code> 找到 rebase 之前的提交哈希，再 <code>git reset --hard &lt;哈希&gt;</code> 恢复。这会丢掉工作区里没提交的修改，执行前先确认。</p>
<h2>常见追问</h2>
<p><strong>为什么有人坚持不用 rebase？</strong></p>
<blockquote>
<p>一是担心改写历史造成混乱，二是逐个提交解决冲突的成本高。只要不在共享分支上用，风险是可控的。</p>
</blockquote>
<p><strong><code>git pull</code> 默认是 merge 还是 rebase？</strong></p>
<blockquote>
<p>默认先 fetch 再 merge。可以用 <code>git config pull.rebase true</code> 改成 rebase。</p>
</blockquote>`};export{e as default};