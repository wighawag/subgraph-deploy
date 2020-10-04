"# subgraph-deploy"

# INSTALL

`npm i -D subgraph-deploy`

# USE

install a subgraph like `eip721-subgraph`

`npm i -D eip721-subgraph`

in your package.json you can add a script to deploy that subgraph in your running graph-node

```json
{
  "scripts": {
    "deploy:eip721-subgraph": "subgraph-deploy -s wighawag/eip721-subgraph -f eip721-subgraph -i http://localhost:5001/api -g http://localhost:8020"
  }
}
```
