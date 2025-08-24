vault.[subfolder].[method]()

const vault = defineVault({
  adapters: [..., redditAdapter()]
})

const redditAdapter = () => defineAdapter({
    schemas: {
        reddit: {
            id: "text",
            title: "text",
            age: "number"
        },
    },
})
