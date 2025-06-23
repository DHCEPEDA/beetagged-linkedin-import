//
//  BATypeAheadViewController.h
//  Bees Chest
//
//  Created by Billy Irwin on 1/1/14.
//  Copyright (c) 2014 Arbrr. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "BATypeAheadView.h"

@protocol BATypeAheadDelegate <NSObject>

- (void)cellClickedWithData:(id)data;

@end

@interface BATypeAheadViewController : UIViewController <UITableViewDataSource, UITableViewDelegate, UITextFieldDelegate>

@property (strong, nonatomic) BATypeAheadView *view;
@property (strong, nonatomic) NSArray *data;
@property (strong, nonatomic) NSMutableArray *searchData;
@property (nonatomic) BOOL isTyping;
@property (nonatomic, assign, readonly) BOOL isOnScreen;
@property (weak, nonatomic) id delegate;

- (id)initWithFrame:(CGRect)frame andData:(NSArray*)data;
- (void)hideAndClearTableView;

- (void)hideView:(BOOL)animated;
- (void)showView:(BOOL)animated;


@end
