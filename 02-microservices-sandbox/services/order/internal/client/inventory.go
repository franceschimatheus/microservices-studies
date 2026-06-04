package client

import (
	"context"
	"errors"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"inventory/pkg/pb"
)

type InventoryClient struct {
	client pb.InventoryServiceClient
	conn   *grpc.ClientConn
}

func NewInventoryClient(addr string) (*InventoryClient, error) {
	// Connect to gRPC server securely on localhost
	conn, err := grpc.Dial(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}

	cli := pb.NewInventoryServiceClient(conn)
	return &InventoryClient{
		client: cli,
		conn:   conn,
	}, nil
}

func (c *InventoryClient) Close() error {
	return c.conn.Close()
}

func (c *InventoryClient) CheckStock(ctx context.Context, productID string) (int, error) {
	resp, err := c.client.CheckStock(ctx, &pb.CheckStockRequest{
		ProductId: productID,
	})
	if err != nil {
		return 0, err
	}
	return int(resp.GetStock()), nil
}

func (c *InventoryClient) ReserveStock(ctx context.Context, productID string, quantity int) error {
	resp, err := c.client.ReserveStock(ctx, &pb.ReserveStockRequest{
		ProductId: productID,
		Quantity:   int32(quantity),
	})
	if err != nil {
		return err
	}
	if !resp.GetSuccess() {
		return errors.New(resp.GetMessage())
	}
	return nil
}

func (c *InventoryClient) ReleaseStock(ctx context.Context, productID string, quantity int) error {
	resp, err := c.client.ReleaseStock(ctx, &pb.ReleaseStockRequest{
		ProductId: productID,
		Quantity:   int32(quantity),
	})
	if err != nil {
		return err
	}
	if !resp.GetSuccess() {
		return errors.New(resp.GetMessage())
	}
	return nil
}
