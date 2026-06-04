{
  description = "A Nix development environment for Go Microservices Sandbox";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, utils }:
    utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            go
            go-task
            gopls
            gotools
            golangci-lint
            protobuf
            protoc-gen-go
            protoc-gen-go-grpc
          ];

          shellHook = ''
            echo "=========================================================="
            echo "🚀 Welcome to the Go Microservices Sandbox Nix DevShell!"
            echo "   Go Version:       $(go version)"
            echo "   Protobuf Version: $(protoc --version)"
            echo "   Run 'task' to list all available execution tasks."
            echo "=========================================================="
          '';
        };
      }
    );
}
