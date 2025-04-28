//
//  BATypeAheadView.m
//  Bees Chest
//
//  Created by Billy Irwin on 1/1/14.
//  Copyright (c) 2014 Arbrr. All rights reserved.
//

#import "BATypeAheadView.h"

#define kTableViewHidden CGRectMake(0, 50, self.frame.size.width, 0)
#define kTableViewVisible(h) CGRectMake(0, 50, self.frame.size.width, h)


@interface BATypeAheadView()
@property (nonatomic, assign) CGFloat padding;
@end

@implementation BATypeAheadView


- (id)initWithFrame:(CGRect)frame {
    self = [super initWithFrame:frame];
    if (self) {
        // Initialization code
        self.padding = 0.0;
        self.tableView = [[UITableView alloc] initWithFrame:[self getTableViewShownFrame:0] style:UITableViewStylePlain];
        self.inputTextField = [[UITextField alloc] initWithFrame:CGRectMake(50, 0, self.frame.size.width - 100.0, kBATypeAheadTextLabelHeight)];
        self.exitButton = [[UIButton alloc] initWithFrame:CGRectMake(self.frame.size.width - 50, 5.0, 25.0, 25.0)];
        [self.exitButton setTitle:@"x" forState:UIControlStateNormal];
        self.exitButton.titleLabel.textColor = [UIColor blackColor];
        self.exitButton.backgroundColor = [UIColor clearColor];
        [self addSubview:self.exitButton];
        
        self.inputTextField.textAlignment = NSTextAlignmentCenter;
        self.inputTextField.backgroundColor = [UIColor clearColor];
        self.inputTextField.textColor = [UIColor blackColor];
        self.inputTextField.font = [UIFont fontWithName:@"HelveticaNeue" size:16.0];
        
        [self addSubview:self.tableView];
        [self addSubview:self.inputTextField];
    }
    return self;
}


- (CGRect)getTableViewHiddenFrame {
    return CGRectMake(-kWidth, kBATypeAheadTextLabelHeight + self.padding, self.frame.size.width, self.frame.size.height - self.padding - kBATypeAheadTextLabelHeight);
}

- (CGRect)getTableViewShownFrame:(CGFloat)height {
    float maxTableViewHeight = self.frame.size.height - self.padding - kBATypeAheadTextLabelHeight;
    
    if (maxTableViewHeight > height) {
        // use the height
        return CGRectMake(0, kBATypeAheadTextLabelHeight + self.padding, self.frame.size.width, height);
    } else {
        // user the max height
        return CGRectMake(0, kBATypeAheadTextLabelHeight + self.padding, self.frame.size.width, maxTableViewHeight);
    }
}

- (void)hideTableView {
    self.tableView.frame = [self getTableViewHiddenFrame];
}

- (void)showTableViewWithHeight:(CGFloat)height {
    self.tableView.frame = [self getTableViewShownFrame:height];
}


@end
