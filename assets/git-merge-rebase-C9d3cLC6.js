var e={answerHtml:`<p>merge 把两条历史汇合，rebase 把一组提交重新应用到另一个基点。两者最后的文件内容可以相同，但描述这段开发过程的提交图不同。</p>
<p>假设 main 和 feature 从 A 分开，之后各自有新提交：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">A---B       main
 \\
  C---D     feature
</code></pre></div>
<h2>merge 保留原来的分叉关系</h2>
<p>在 main 上合并 feature，普通的分叉合并会生成合并提交 M：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">A---B-----M  main
 \\       /
  C-----D    feature
</code></pre></div>
<p>M 通常有两个父提交，分别连接合并前的 main 与 feature。C、D 的身份没有被改写，历史可以表达这条分支曾经独立开发、后来汇合。</p>
<p>但 merge 不一定产生新提交。如果当前分支没有产生分叉，目标提交就是沿现有历史向前走，可以直接移动分支指针，这叫 fast-forward。是否强制创建合并提交，还取决于参数与团队策略。</p>
<h2>rebase 改变提交所依附的历史</h2>
<p>在 feature 上执行 <code>git rebase main</code>，Git 会把相应改动重新应用到 B 后面：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">A---B---C&#x27;---D&#x27;  feature
    |
   main
</code></pre></div>
<p>C&#x27;、D&#x27; 通常是新提交。即使改动内容相似，父提交等信息改变后，提交对象的哈希也会改变。之后 main 合并这条没有再次分叉的 feature，就可以快进。</p>
<p>这不是把原来的 C、D 原封不动搬到另一处。rebase 还可能跳过已经存在的等价改动、处理空提交或按选项保留合并关系，不能保证任何输入都机械地产生同样数量的新提交。</p>
<h2>冲突出现的时机不同</h2>
<p>merge 通常在一次汇合中解决冲突；rebase 逐个重新应用提交，同一片区域可能在不同提交重放时分别需要处理。</p>
<p>解决冲突后，应检查实际文件与业务行为，再暂存结果并继续操作。常见流程是 rebase 冲突处理后使用 <code>git rebase --continue</code>，不准备继续时用 <code>git rebase --abort</code>。merge 也有相应的继续或中止机制。</p>
<p><code>--skip</code> 是跳过当前要应用的提交，不是“自动正确解决冲突”。中止操作也不应被当成保护所有事前未提交修改的万能备份，开始之前应先弄清工作区状态。</p>
<h2>为什么共享历史要谨慎 rebase</h2>
<p>如果别人已经基于 D 开发，你把它改成 D&#x27; 后，协作者手里的旧提交并不会自动变成新历史。再次同步时可能出现重复改动或需要额外协调。</p>
<p>所以尚未共享的个人分支适合按团队约定整理；已被多人依赖的公共分支，不应随意重写并覆盖远端。<code>--force-with-lease</code> 比盲目强推增加了远端状态检查，但不能代替团队沟通，也不保证别人的工作流完全不受影响。</p>
<h2>怎么选择更合适</h2>
<p>希望保留分支汇合过程、避免改写已共享提交时，merge 通常更直接。希望在合并前整理个人提交、形成便于阅读的线性历史时，可以考虑 rebase。</p>
<p>“历史直”不是唯一目标。还要看代码审查、回滚、排错和团队约定。无论使用哪一种，都应确认当前分支、目标基点与最终差异；命令成功只证明 Git 完成了操作，不证明冲突解决后的程序一定正确。</p>`};export{e as default};