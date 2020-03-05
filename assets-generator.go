// +build ignore

package main

import (
	"log"
	"net/http"

	"github.com/shurcooL/vfsgen"
)

func main() {
	err := vfsgen.Generate(http.Dir("internal/view"), vfsgen.Options{
		Filename:     "internal/backend/ui/assets-prod.go",
		PackageName:  "ui",
		BuildTags:    "prod",
		VariableName: "assets",
	})

	if err != nil {
		log.Fatalln(err)
	}
}
