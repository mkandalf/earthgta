all:
	# create gh-pages branch
	git checkout --orphan gh-pages
	# move app to root
	git add .
	git commit -m "Pushing to gh-pages"
	git push -f origin gh-pages
	# switch back to master
	git checkout master
	git branch -D gh-pages
