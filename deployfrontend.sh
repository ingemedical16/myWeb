rsync -r src/ docs/
rsync build/contracts/PlaceDeMarche.json docs/
git add .
git commit -m "Adding frontend files to Github Pages web"
git push
