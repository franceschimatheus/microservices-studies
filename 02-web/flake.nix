{
  description = "A Nix development environment for Next.js Web Frontend";

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
            nodejs_22
          ];

          shellHook = ''
            echo "=========================================================="
            echo "🚀 Welcome to the Web Frontend Nix DevShell!"
            echo "   Node Version: $(node --version)"
            echo "   NPM Version:  $(npm --version)"
            echo "=========================================================="
          '';
        };
      }
    );
}
